import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperAuthModal } from "./DeveloperAuthModal";
import { setActiveContext } from "@/lib/routing/activeContext";

/**
 * Auth guard for /developers/portal/* routes.
 * Sets context to "developer" — no onboarding/org checks.
 */
export function DeveloperPortalGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [authState, setAuthState] = useState<"loading" | "authed" | "guest">("loading");
  const [showAuth, setShowAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setAuthState(session?.user ? "authed" : "guest");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthState(session?.user ? "authed" : "guest");
      if (session?.user) setShowAuth(false);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // Mark context as "developer"
  useEffect(() => {
    if (authState === "authed") setActiveContext("developer");
  }, [authState]);

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
          onClose={() => setShowAuth(true)}
          returnTo={location.pathname + location.search}
          onSuccess={() => {}}
        />
        {!showAuth && (
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-3">Sign in to access the Developer Portal.</p>
            <button onClick={() => setShowAuth(true)} className="text-sm text-accent hover:underline">
              Sign in
            </button>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
