import { Link } from "react-router-dom";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight } from "lucide-react";

export default function VerifyEmail() {
  return (
    <AuthShell
      title="Verify your email"
      subtitle="We've sent you a verification link"
      showBackLink={false}
    >
      <div className="space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <Mail className="h-8 w-8 text-accent" />
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground">
            Check your email inbox and click the verification link to complete your registration.
          </p>
          <p className="text-sm text-muted-foreground">
            The link will expire in 24 hours.
          </p>
        </div>

        <div className="space-y-3">
          <Link to="/auth/login">
            <Button variant="accent" className="w-full">
              Continue to login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

          <p className="text-sm text-muted-foreground">
            Didn't receive an email?{" "}
            <Link to="/auth/signup" className="text-accent hover:underline">
              Try again
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
