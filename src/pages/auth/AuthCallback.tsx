import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getReturnToFromParams } from "@/lib/routing/identityRedirect";
import { AuthShell } from "@/components/auth/AuthShell";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = getReturnToFromParams(searchParams);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          setErrorMsg(error.message || "Authentication failed");
          toast.error("Sign in failed. Please try again.");
          setTimeout(() => navigate("/auth/login"), 2000);
          return;
        }

        if (session?.user) {
          // Check for developer auth intent (stored by DeveloperAuthModal)
          const devReturn = sessionStorage.getItem("dev_auth_return")
            || searchParams.get("devReturn");

          if (import.meta.env.DEV) {
            console.log("[DEV_AUTH] AuthCallback", { devReturn, sessionReturn: sessionStorage.getItem("dev_auth_return"), queryReturn: searchParams.get("devReturn") });
          }

          if (devReturn) {
            sessionStorage.removeItem("dev_auth_return");

            // Ensure developer has an org before entering portal
            const { data: existingOrg } = await supabase
              .from("org_memberships")
              .select("org_id")
              .eq("user_id", session.user.id)
              .limit(1)
              .maybeSingle();

            if (!existingOrg) {
              try {
                const { data: newOrg } = await supabase
                  .from("orgs")
                  .insert({ name: "My Organization", owner_user_id: session.user.id })
                  .select("id")
                  .single();
                if (newOrg) {
                  await supabase
                    .from("org_memberships")
                    .insert({ org_id: newOrg.id, user_id: session.user.id, role: "owner" });
                }
              } catch (e) {
                console.error("Dev org bootstrap failed:", e);
              }
            }

            // Developer auth → skip onboarding, go directly to portal
            const destination = decodeURIComponent(devReturn);
            if (import.meta.env.DEV) console.log("[DEV_AUTH] Routing to developer portal:", destination);
            navigate(destination, { replace: true });
            return;
          }

          // Check profile + username + onboarding status
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed, username, country, business_name")
            .eq("id", session.user.id)
            .single();

          if (!profile || !profile.onboarding_completed || !profile.username || !profile.country || !profile.business_name) {
            // If user was in developer context, skip onboarding entirely
            const activeCtx = sessionStorage.getItem("yangu_active_context");
            if (activeCtx === "developer") {
              navigate("/developers/portal/apps", { replace: true });
            } else {
              navigate("/onboarding");
            }
          } else if (returnTo) {
            window.location.href = returnTo;
          } else {
            navigate("/dashboard");
          }
        } else {
          setErrorMsg("No session found. Please sign in again.");
          toast.error("No session found. Please sign in again.");
          setTimeout(() => navigate("/auth/login"), 2000);
        }
      } catch (err) {
        console.error("Auth callback failed:", err);
        setErrorMsg("An unexpected error occurred");
        toast.error("Authentication failed. Redirecting...");
        setTimeout(() => navigate("/auth/login"), 2000);
      }
    };

    handleCallback();
  }, [navigate, returnTo, searchParams]);

  return (
    <AuthShell
      title={errorMsg ? "Sign in failed" : "Signing you in..."}
      subtitle={errorMsg || "Please wait while we complete your authentication"}
      showBackLink={false}
    >
      <div className="flex justify-center py-8">
        {errorMsg ? (
          <p className="text-sm text-destructive text-center">{errorMsg}</p>
        ) : (
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        )}
      </div>
    </AuthShell>
  );
}
