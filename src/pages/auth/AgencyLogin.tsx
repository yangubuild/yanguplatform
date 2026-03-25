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

export default function AgencyLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
              Sign in to your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
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
                <Link
                  to="/auth/reset-password"
                  className="text-sm text-[hsl(24,95%,53%)] hover:underline"
                >
                  Forgot password?
                </Link>
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg text-white font-semibold text-base bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--accent-dark))] hover:opacity-90 transition-opacity"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
