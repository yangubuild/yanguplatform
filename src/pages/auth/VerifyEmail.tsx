import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error("No email address found. Please sign up again.");
      return;
    }
    setResending(true);
    setResendSuccess(false);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message || "Failed to resend verification email");
      } else {
        setResendSuccess(true);
        toast.success("Verification email sent!");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle="We've sent you a verification link"
      showBackLink={false}>
      <div className="space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <Mail className="h-8 w-8 text-accent" />
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground">
            Check your email inbox and click the verification link to complete your registration.
          </p>
          {email && (
            <p className="text-sm font-medium text-foreground">{email}</p>
          )}
          <p className="text-sm text-muted-foreground">
            The link will expire in 24 hours.
          </p>
        </div>

        {resendSuccess && (
          <div className="flex items-center gap-2 justify-center text-sm" style={{ color: "#22c55e" }}>
            <CheckCircle2 className="h-4 w-4" />
            Verification email sent successfully
          </div>
        )}

        <div className="space-y-3">
          <Link to="/auth/login">
            <Button variant="accent" className="w-full">
              Continue to login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

          <div className="text-sm text-muted-foreground">
            Didn't receive an email?{" "}
            {email ? (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-accent hover:underline font-medium inline-flex items-center gap-1">
                {resending && <Loader2 className="h-3 w-3 animate-spin" />}
                {resending ? "Sending..." : "Resend verification"}
              </button>
            ) : (
              <Link to="/auth/signup" className="text-accent hover:underline font-medium">
                Try again
              </Link>
            )}
          </div>

          {!email && (
            <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
              Sign up again to receive a new verification email
            </div>
          )}
        </div>
      </div>
    </AuthShell>
  );
}
