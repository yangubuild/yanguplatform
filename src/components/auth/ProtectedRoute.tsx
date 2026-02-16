import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, needsOnboarding, profile } = useAuth();
  const { data: activeOrg, isLoading: orgLoading } = useActiveOrg();
  const location = useLocation();

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
    // Block if onboarding not completed
    if (needsOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }

    // Block if no username set
    if (!profile?.username) {
      return <Navigate to="/onboarding" replace />;
    }

    // Block if no org/membership exists
    if (!activeOrg) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}
