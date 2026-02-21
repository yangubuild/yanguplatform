import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperAuthModal } from "./DeveloperAuthModal";

/**
 * Wraps any /developers/console/* route.
 * If not authenticated, blocks UI and shows DeveloperAuthModal.
 * Uses direct Supabase session check to avoid stale context issues.
 */
export function ConsoleAuthGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<"loading" | "authed" | "guest">("loading");
  const [showAuth, setShowAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Direct session check — no reliance on context
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setAuthState(session?.user ? "authed" : "guest");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthState(session?.user ? "authed" : "guest");
      if (session?.user) setShowAuth(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (authState === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (authState === "guest") {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-muted-foreground text-sm">Sign in to access the Developer Console.</p>
        <DeveloperAuthModal
          open={showAuth}
          onClose={() => {
            setShowAuth(false);
            navigate("/developers");
          }}
          returnTo={location.pathname + location.search}
          onSuccess={() => {
            // authState will flip to "authed" via onAuthStateChange
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
}
