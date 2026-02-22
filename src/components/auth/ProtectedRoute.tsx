import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { Loader2 } from "lucide-react";

const DEV_CONTEXT_KEY = "yangu_active_context";

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, needsOnboarding, profile } = useAuth();
  const { data: activeOrg, isLoading: orgLoading } = useActiveOrg();
  const location = useLocation();

  // Mark active context as "platform" — clears any developer context flag
  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.setItem(DEV_CONTEXT_KEY, "platform");
    }
  }, [isAuthenticated]);

  if (isLoading || orgLoading) {
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

  if (requireOnboarding) {
    if (needsOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
    if (!profile?.username) {
      return <Navigate to="/onboarding" replace />;
    }
    if (!activeOrg) {
      return <Navigate to="/onboarding" replace />;
    }
    if (!(profile as any)?.country || !(profile as any)?.business_name) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}
