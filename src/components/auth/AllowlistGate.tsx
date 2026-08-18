import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Sun, Moon, LogOut } from "lucide-react";
import { YanguLogo } from "@/components/brand/YanguLogo";

interface AllowlistGateProps {
  children: ReactNode;
}

type State = "loading" | "allowed" | "blocked";

/**
 * Gates every dashboard/builder/editor entry point behind the
 * `dashboard_allowlist` table. Non-allowlisted users see a
 * non-dismissible themed popup that mirrors AuthShell styling.
 * SELECT on public storefronts, auth flows, and password-reset
 * routes are NOT mounted under this gate.
 */
export function AllowlistGate({ children }: AllowlistGateProps) {
  const [state, setState] = useState<State>("loading");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        // ProtectedRoute should have already redirected; fail closed.
        if (!cancelled) setState("blocked");
        return;
      }
      const { data, error } = await supabase.rpc("is_dashboard_allowed", {
        _user_id: uid,
      });
      if (cancelled) return;
      if (error) {
        if (import.meta.env.DEV) console.error("allowlist check failed", error);
        setState("blocked");
        return;
      }
      setState(data === true ? "allowed" : "blocked");
    };

    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state === "allowed") return <>{children}</>;

  return (
    <div
      className="fixed inset-0 z-[9999] min-h-screen flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby="allowlist-gate-title">
      <header className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <YanguLogo className="h-8" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h1
              id="allowlist-gate-title"
              className="text-2xl md:text-3xl font-bold tracking-tight">
              {state === "loading" ? "Checking your access…" : "Almost there"}
            </h1>
          </div>

          <div className="bg-surface rounded-2xl border border-border p-6 md:p-8 shadow-lg space-y-6">
            <p className="text-base text-foreground leading-relaxed text-center">
              {state === "loading"
                ? "One moment while we confirm your account…"
                : "We're getting things ready! You'll receive an email as soon as your Yangu account is ready to use."}
            </p>

            {state === "blocked" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            )}
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} yangu. All rights reserved.</p>
      </footer>
    </div>
  );
}