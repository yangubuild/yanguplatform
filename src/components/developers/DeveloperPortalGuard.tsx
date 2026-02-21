import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperAuthModal } from "./DeveloperAuthModal";

/**
 * Auth guard for /developers/portal/* routes.
 * Unlike ProtectedRoute, this does NOT check onboarding/profile/org —
 * developers skip main platform onboarding entirely.
 */
export function DeveloperPortalGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [authState, setAuthState] = useState<"loading" | "authed" | "guest">("loading");
  const [showAuth, setShowAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const state = session?.user ? "authed" : "guest";
      if (import.meta.env.DEV) console.log("[DEV_AUTH] Portal guard session:", state);
      setAuthState(state);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const state = session?.user ? "authed" : "guest";
      if (import.meta.env.DEV) console.log("[DEV_AUTH] Portal guard auth change:", _event, state);
      setAuthState(state);
      if (session?.user) setShowAuth(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (authState === "guest") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <DeveloperAuthModal
          open={showAuth}
          onClose={() => setShowAuth(true)} // Keep modal open — no escape for portal
          returnTo={location.pathname + location.search}
          onSuccess={() => {
            // authState will flip via onAuthStateChange
          }}
        />
        {!showAuth && (
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-3">Sign in to access the Developer Portal.</p>
            <button
              onClick={() => setShowAuth(true)}
              className="text-sm text-accent hover:underline"
            >
              Sign in
            </button>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
