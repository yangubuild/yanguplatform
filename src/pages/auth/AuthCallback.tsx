import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getReturnToFromParams } from "@/lib/routing/identityRedirect";
import { AuthShell } from "@/components/auth/AuthShell";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = getReturnToFromParams(searchParams);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          navigate("/auth/login");
          return;
        }

        if (session?.user) {
          // Check if user needs onboarding
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", session.user.id)
            .single();

          if (profile && !profile.onboarding_completed) {
            navigate("/onboarding");
          } else if (returnTo) {
            window.location.href = returnTo;
          } else {
            navigate("/dashboard");
          }
        } else {
          navigate("/auth/login");
        }
      } catch (err) {
        console.error("Auth callback failed:", err);
        navigate("/auth/login");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <AuthShell
      title="Signing you in..."
      subtitle="Please wait while we complete your authentication"
      showBackLink={false}
    >
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    </AuthShell>
  );
}
