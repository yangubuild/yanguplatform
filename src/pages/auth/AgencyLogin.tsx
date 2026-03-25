import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import yanguIcon from "@/assets/yangu-agency-icon.png";

type Mode = "login" | "signup";

export default function AgencyLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate(from, { replace: true });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await supabase.functions.invoke("agency-owner-signup", {
        body: { email: email.trim(), password },
      });

      if (res.error) {
        const msg = res.error?.message || "Signup failed";
        toast.error(msg);
        setLoading(false);
        return;
      }

      const data = res.data as { success?: boolean; error?: string; message?: string };

      if (data?.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      toast.success(data?.message || "Account created! You can now sign in.");
      setMode("login");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--admin-bg))] px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-card))] p-8 md:p-10 space-y-8">
          {/* Branding */}
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-2">
              <img src={yanguIcon} alt="yangu" className="h-12 w-12" />
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--admin-text))]">
              Yangu Agency
            </h1>
            <p className="text-sm text-[hsl(var(--admin-text-muted))]">
              {mode === "login" ? "Sign in to your account" : "Create your owner account"}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex rounded-lg overflow-hidden border border-[hsl(var(--admin-border))]">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === "login"
                  ? "bg-gradient-to-r from-[hsl(var(--admin-accent))] to-[hsl(25,70%,35%)] text-white"
                  : "bg-[hsl(var(--admin-surface))] text-[hsl(var(--admin-text-muted))] hover:text-[hsl(var(--admin-text))]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === "signup"
                  ? "bg-gradient-to-r from-[hsl(var(--admin-accent))] to-[hsl(25,70%,35%)] text-white"
                  : "bg-[hsl(var(--admin-surface))] text-[hsl(var(--admin-text-muted))] hover:text-[hsl(var(--admin-text))]"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[hsl(var(--admin-text))] font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-[hsl(var(--admin-surface))] border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text))] placeholder:text-[hsl(var(--admin-text-muted))] h-12 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[hsl(var(--admin-text))] font-semibold">
                  Password
                </Label>
                {mode === "login" && (
                  <Link
                    to="/auth/reset-password"
                    className="text-sm text-[hsl(24,95%,53%)] hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-[hsl(var(--admin-surface))] border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text))] placeholder:text-[hsl(var(--admin-text-muted))] h-12 rounded-lg"
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[hsl(var(--admin-text))] font-semibold">
                  Confirm Password
                </Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-[hsl(var(--admin-surface))] border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text))] placeholder:text-[hsl(var(--admin-text-muted))] h-12 rounded-lg"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg text-white font-semibold text-base bg-gradient-to-r from-[hsl(var(--admin-accent))] to-[hsl(25,70%,35%)] hover:opacity-90 transition-opacity border border-[hsl(var(--admin-accent)/0.3)]"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {mode === "signup" && (
            <p className="text-xs text-center text-[hsl(var(--admin-text-muted))]">
              Only authorized owner emails can create an account.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
