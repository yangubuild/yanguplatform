/**
 * CommerceAuthSheet — App-style in-modal sign in / sign up for live shops.
 *
 * Phase 2: gates checkout. Guest can browse + add to cart freely. When the
 * shopper hits "Place Order", this sheet appears. On successful sign in,
 * the parent calls `onAuthed()` which resumes the in-flight order — cart
 * contents stay intact (cart lives in localStorage keyed by surface).
 */

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CommerceAuthSheetProps {
  open: boolean;
  onClose: () => void;
  onAuthed: () => void;
  businessName?: string;
}

type Mode = "signin" | "signup";

export function CommerceAuthSheet({
  open,
  onClose,
  onAuthed,
  businessName,
}: CommerceAuthSheetProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const handleEmail = async () => {
    if (!email.trim() || !password) {
      toast.error("Email and password are required");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.href,
            data: { full_name: name.trim() || undefined },
          },
        });
        if (error) throw error;

        // If email confirmation is required, signUp returns no session.
        // Try to sign in immediately — works when auto-confirm is on, OR
        // when the email already existed with this password.
        if (!data.session) {
          const { data: signInData, error: signInErr } =
            await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            });
          if (signInErr || !signInData.session) {
            // Email confirmation required. Tell the user clearly.
            setBusy(false);
            toast.success(
              "Account created! Check your email to verify, then return to complete your order.",
              { duration: 6000 },
            );
            return;
          }
        }
        toast.success("Account created — continuing your order");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (!data.session) {
          throw new Error("Sign in failed — no session returned");
        }
        toast.success("Signed in — continuing your order");
      }
      // Clear busy BEFORE calling onAuthed so the sheet never gets stuck
      // if the parent's resume handler throws or hangs.
      setBusy(false);
      try {
        onAuthed();
      } catch (cbErr) {
        console.error("onAuthed callback failed:", cbErr);
      }
      return;
    } catch (err: any) {
      console.error("Commerce auth failed:", err);
      toast.error(err?.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.href },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err?.message || "Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-bold">
              {mode === "signin" ? "Sign in to continue" : "Create your account"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {businessName
                ? `Sign in to place your order at ${businessName}.`
                : "Sign in to place your order."}
              <br />
              Your cart will be kept.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={busy}
          >
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            or
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-3">
            {mode === "signup" && (
              <div>
                <Label htmlFor="auth-name">Name</Label>
                <Input
                  id="auth-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleEmail}
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Please wait…
              </>
            ) : mode === "signin" ? (
              "Sign in & continue"
            ) : (
              "Create account & continue"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => setMode("signup")}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
