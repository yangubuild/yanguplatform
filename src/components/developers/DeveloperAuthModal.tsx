import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DeveloperAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Where to redirect after auth completes (stored for callback routing) */
  returnTo?: string;
}

export function DeveloperAuthModal({ open, onClose, onSuccess, returnTo }: DeveloperAuthModalProps) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [devUpdates, setDevUpdates] = useState(false);
  const [signupEmailSent, setSignupEmailSent] = useState(false);

  if (!open) return null;

  const storeDevIntent = (destination: string) => {
    sessionStorage.setItem("dev_auth_return", destination);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (returnTo) storeDevIntent(returnTo);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Signed in");
      onSuccess();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (returnTo) storeDevIntent(returnTo);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?devReturn=${encodeURIComponent(returnTo || "/developers/portal/overview")}`,
        data: {
          dev_updates_opt_in: devUpdates,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else if (data?.user?.identities?.length === 0) {
      // User already exists
      toast.error("An account with this email already exists. Try signing in.");
    } else if (data?.session) {
      // Auto-confirmed (no email verification needed) — route immediately
      if (devUpdates) localStorage.setItem("dev_updates_opt_in", "true");
      toast.success("Account created!");
      onSuccess();
    } else {
      // Email confirmation required — show persistent message, do NOT close modal
      if (devUpdates) localStorage.setItem("dev_updates_opt_in", "true");
      setSignupEmailSent(true);
    }
  };

  const handleGoogleSignIn = async () => {
    const dest = returnTo || "/developers/portal/overview";
    storeDevIntent(dest);
    try {
      const { lovable } = await import("@/integrations/lovable/index");
      await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback?devReturn=${encodeURIComponent(dest)}`,
      });
    } catch {
      toast.error("Google sign-in is not available");
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg text-sm text-foreground placeholder:text-muted-foreground bg-muted/30 border border-border focus:border-accent/50 focus:outline-none transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 rounded-2xl p-6 bg-background border border-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-foreground mb-1">Developer Portal</h2>
        <p className="text-sm text-muted-foreground mb-5">Sign in to create and manage your apps.</p>

        {/* Email confirmation sent state */}
        {signupEmailSent ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-base font-semibold text-foreground">Check your email</h3>
            <p className="text-sm text-muted-foreground">
              We sent a confirmation link to <strong className="text-foreground">{email}</strong>.
              <br />Click the link to activate your developer account.
            </p>
            <button
              onClick={() => { setSignupEmailSent(false); setTab("signin"); }}
              className="text-xs text-accent hover:underline mt-2">
              Back to sign in
            </button>
          </div>
        ) : (
          <>
        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-lg bg-muted/30">
          <button
            onClick={() => setTab("signin")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === "signin" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground/70"
            }`}>
            Sign in
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === "signup" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground/70"
            }`}>
            Create account
          </button>
        </div>

        <form onSubmit={tab === "signin" ? handleSignIn : handleSignUp} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className={inputClass}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className={inputClass}
          />

          {/* Developer Updates opt-in (signup only) */}
          {tab === "signup" && (
            <label className="flex items-start gap-2 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={devUpdates}
                onChange={(e) => setDevUpdates(e.target.checked)}
                className="mt-0.5 accent-accent"
              />
              <span className="text-xs text-muted-foreground leading-tight">
                Email me updates on new APIs and developer features
              </span>
            </label>
          )}

          <Button
            type="submit"
            variant="accent"
            className="w-full"
            disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : tab === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 text-muted-foreground bg-background">
              or
            </span>
          </div>
        </div>

        <Button
          variant="secondary"
          className="w-full bg-muted/30 border border-border text-foreground/80 hover:bg-muted/50"
          onClick={handleGoogleSignIn}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>
          </>
        )}
      </div>
    </div>
  );
}
