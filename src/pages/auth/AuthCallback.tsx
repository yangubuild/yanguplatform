import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getReturnToFromParams } from "@/lib/routing/identityRedirect";
import { getActiveContext, setActiveContext } from "@/lib/routing/activeContext";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = getReturnToFromParams(searchParams);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Detect OAuth error params from URL hash/query (e.g. from oauth.lovable.app redirect)
  const urlError = searchParams.get("error");
  const urlErrorDesc = searchParams.get("error_description");

  const clearAuthCache = useCallback(() => {
    // Clear any stale OAuth state from storage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("supabase") || key.includes("sb-") || key.includes("oauth"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes("supabase") || key.includes("sb-") || key.includes("oauth"))) {
          sessionStorage.removeItem(key);
        }
      }
      // Clear auth cookies
      document.cookie.split(";").forEach((c) => {
        const name = c.trim().split("=")[0];
        if (name.includes("sb-") || name.includes("supabase") || name.includes("oauth")) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
    } catch (e) {
      console.warn("Failed to clear auth cache:", e);
    }
    toast.success("Auth cache cleared. Please try signing in again.");
    navigate("/auth/login", { replace: true });
  }, [navigate]);

  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    clearAuthCache();
  }, [clearAuthCache]);

  useEffect(() => {
    // If URL contains an OAuth error, show it immediately
    if (urlError) {
      const msg = urlErrorDesc
        ? decodeURIComponent(urlErrorDesc.replace(/\+/g, " "))
        : `OAuth error: ${urlError}`;
      console.error("[AuthCallback] OAuth error from URL:", { error: urlError, description: urlErrorDesc, userAgent: navigator.userAgent });
      setErrorMsg(msg);
      return; // Don't auto-redirect — let user choose retry
    }

    const handleCallback = async () => {
      try {
        console.log("[AuthCallback] Processing callback", {
          origin: window.location.origin,
          hash: window.location.hash ? "(present)" : "(empty)",
          search: window.location.search ? "(present)" : "(empty)",
          userAgent: navigator.userAgent,
          time: new Date().toISOString(),
        });

        // If URL contains a hash with access_token, wait for Supabase to process it
        if (window.location.hash.includes("access_token")) {
          console.log("[AuthCallback] Hash contains tokens, waiting for Supabase to process...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        let { data: { session }, error } = await supabase.auth.getSession();

        // Retry once after a short delay if no session yet (mobile Safari can be slow)
        if (!session && !error) {
          console.log("[AuthCallback] No session on first attempt, retrying...");
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const retry = await supabase.auth.getSession();
          session = retry.data.session;
          error = retry.error;
        }

        if (error) {
          console.error("Auth callback error:", error);
          setErrorMsg(error.message || "Authentication failed");
          return;
        }

        if (session?.user) {
          const devReturn = sessionStorage.getItem("dev_auth_return")
            || searchParams.get("devReturn");

          if (devReturn) {
            sessionStorage.removeItem("dev_auth_return");
            setActiveContext("developer");

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

            const destination = decodeURIComponent(devReturn);
            navigate(destination, { replace: true });
            return;
          }

          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed, username, country, business_name")
            .eq("id", session.user.id)
            .single();

          if (!profile || !profile.onboarding_completed || !profile.username || !profile.country || !profile.business_name) {
            const ctx = getActiveContext(returnTo ?? undefined);
            if (ctx === "developer") {
              navigate("/developers/portal/apps", { replace: true });
            } else {
              navigate("/onboarding");
            }
          } else if (returnTo) {
            const ctx = getActiveContext(returnTo);
            if (ctx === "developer" && !returnTo.startsWith("/developers")) {
              navigate("/developers/portal/apps", { replace: true });
            } else if (ctx === "platform" && returnTo.startsWith("/developers/portal")) {
              navigate("/dashboard", { replace: true });
            } else {
              window.location.href = returnTo;
            }
          } else {
            const ctx = getActiveContext();
            navigate(ctx === "developer" ? "/developers/portal/apps" : "/dashboard", { replace: true });
          }
        } else {
          setErrorMsg("No session found. Please sign in again.");
        }
      } catch (err) {
        console.error("Auth callback failed:", err);
        setErrorMsg("An unexpected error occurred");
      }
    };

    handleCallback();
  }, [navigate, returnTo, searchParams, urlError, urlErrorDesc]);

  return (
    <AuthShell
      title={errorMsg ? "Sign in failed" : "Signing you in..."}
      subtitle={errorMsg ? undefined : "Please wait while we complete your authentication"}
      showBackLink={false}>
      <div className="flex flex-col items-center gap-4 py-8">
        {errorMsg ? (
          <>
            <p className="text-sm text-destructive text-center max-w-sm">{errorMsg}</p>
            <div className="flex flex-col gap-3 w-full max-w-xs pt-2">
              <Button
                variant="accent"
                className="w-full"
                onClick={handleRetry}
                disabled={isRetrying}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry login
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={clearAuthCache}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear auth cache & retry
              </Button>
            </div>
          </>
        ) : (
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        )}
      </div>
    </AuthShell>
  );
}
