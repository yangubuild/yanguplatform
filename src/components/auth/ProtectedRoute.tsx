import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { Loader2 } from "lucide-react";
import { setActiveContext, getActiveContext } from "@/lib/routing/activeContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading, needsOnboarding, profile } = useAuth();
  const { data: activeOrg, isLoading: orgLoading } = useActiveOrg();
  const location = useLocation();

  // Mark context as "platform"
  useEffect(() => {
    if (isAuthenticated) setActiveContext("platform");
  }, [isAuthenticated]);

  // Auth is still resolving — show spinner (blocks everything)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginUrl = `/auth/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={loginUrl} replace />;
  }

  // Profile must be loaded before evaluating onboarding gates
  // But org can load in parallel — only block if we actually need it for the gate check
  if (requireOnboarding) {
    // If profile isn't loaded yet, wait (shouldn't happen since authLoading covers it)
    if (!profile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      );
    }

    // If the user is actually in developer context, don't force platform onboarding
    const ctx = getActiveContext(location.pathname);
    if (ctx === "developer") {
      return <Navigate to="/developers/portal/apps" replace />;
    }

    // Suspended users cannot access the app
    if ((profile as any).account_status === 'suspended') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <h1 className="text-xl font-bold text-foreground mb-2">Account Suspended</h1>
            <p className="text-muted-foreground text-sm">Your account has been suspended. Please contact support for assistance.</p>
          </div>
        </div>
      );
    }

    if (needsOnboarding) return <Navigate to="/onboarding" replace />;
    if (!profile?.username) return <Navigate to="/onboarding" replace />;

    // Org check — only block on initial load (no cached data yet)
    if (orgLoading && !activeOrg) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      );
    }
    if (!orgLoading && !activeOrg) return <Navigate to="/onboarding" replace />;

    if (!(profile as any)?.country || !(profile as any)?.business_name) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}
