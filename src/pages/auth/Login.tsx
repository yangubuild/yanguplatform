import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getReturnToFromParams } from "@/lib/routing/identityRedirect";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = useMemo(() => getReturnToFromParams(searchParams), [searchParams]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please verify your email before signing in");
          navigate("/auth/verify-email");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Welcome back!");
      if (returnTo) {
        window.location.href = returnTo;
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    const email = form.getValues("email");
    
    if (!email || !z.string().email().safeParse(email).success) {
      form.setError("email", { message: "Please enter a valid email address" });
      return;
    }

    setIsMagicLinkLoading(true);
    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      if (returnTo) callbackUrl.searchParams.set("returnTo", returnTo);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Check your email for the magic link!");
      setShowMagicLink(true);
    } catch (err) {
      toast.error("Failed to send magic link");
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  if (showMagicLink) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="We sent you a magic link to sign in"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-accent" />
          </div>
          <p className="text-sm text-muted-foreground">
            Click the link in your email to sign in. The link will expire in 1 hour.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowMagicLink(false)}
          >
            Back to login
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your account"
    >
      <div className="space-y-6">
        <SocialAuthButtons disabled={isLoading || isMagicLinkLoading} />

        <AuthDivider />

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isLoading || isMagicLinkLoading}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/auth/reset-password"
                className="text-sm text-accent hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading || isMagicLinkLoading}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              variant="accent"
              className="w-full h-11"
              disabled={isLoading || isMagicLinkLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleMagicLink}
              disabled={isLoading || isMagicLinkLoading}
            >
              {isMagicLinkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Mail className="mr-2 h-4 w-4" />
              Send magic link instead
            </Button>
          </div>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/auth/signup" className="text-accent hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
