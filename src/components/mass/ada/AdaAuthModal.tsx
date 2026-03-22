import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Mail, X } from "lucide-react";
import { Link } from "react-router-dom";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface AdaAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AdaAuthModal({ open, onOpenChange, onSuccess }: AdaAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Listen for auth state change to auto-close on login
  useEffect(() => {
    if (!open) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        onOpenChange(false);
        onSuccess?.();
        toast.success("Welcome back!");
      }
    });
    return () => subscription.unsubscribe();
  }, [open, onOpenChange, onSuccess]);

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
        } else {
          toast.error(error.message);
        }
        return;
      }
      // onAuthStateChange will handle close
    } catch {
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
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl.toString() },
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Check your email for the magic link!");
      setShowMagicLink(true);
    } catch {
      toast.error("Failed to send magic link");
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border p-0 gap-0 [&>button]:hidden">
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold">Sign in to continue</DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Create a free account to keep chatting with Ada and generate images.
          </p>

          {showMagicLink ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">
                Click the link in your email to sign in.
              </p>
              <Button variant="outline" className="w-full" onClick={() => setShowMagicLink(false)}>
                Back to login
              </Button>
            </div>
          ) : (
            <>
              <SocialAuthButtons disabled={isLoading || isMagicLinkLoading} />
              <AuthDivider />
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ada-email">Email</Label>
                  <Input id="ada-email" type="email" placeholder="you@example.com" autoComplete="email" disabled={isLoading || isMagicLinkLoading} {...form.register("email")} />
                  {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ada-password">Password</Label>
                  <Input id="ada-password" type="password" placeholder="••••••••" autoComplete="current-password" disabled={isLoading || isMagicLinkLoading} {...form.register("password")} />
                  {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
                </div>
                <div className="space-y-2 pt-1">
                  <Button type="submit" variant="accent" className="w-full h-10" disabled={isLoading || isMagicLinkLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign in
                  </Button>
                  <Button type="button" variant="ghost" className="w-full text-xs" onClick={handleMagicLink} disabled={isLoading || isMagicLinkLoading}>
                    {isMagicLinkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Mail className="mr-2 h-3.5 w-3.5" />
                    Send magic link instead
                  </Button>
                </div>
              </form>
              <p className="text-center text-xs text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/auth/signup" className="text-accent hover:underline font-medium">Sign up</Link>
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
