import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { setActiveContext } from "@/lib/routing/activeContext";
import { Loader2, ShieldX } from "lucide-react";

interface ManagementGuardProps {
  children: ReactNode;
}

/**
 * Guard for the management subdomain (manage.yangu.studio).
 * - Requires authenticated user with admin or management role.
 * - Does NOT trigger onboarding redirects.
 * - Sets active context to "management".
 */
export function ManagementGuard({ children }: ManagementGuardProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasAnyManageRole, isLoading: rolesLoading } = useRoles();
  const location = useLocation();

  // Set management context on mount
  useEffect(() => {
    if (isAuthenticated && hasAnyManageRole) {
      setActiveContext("management");
    }
  }, [isAuthenticated, hasAnyManageRole]);

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login — management login is handled by the route itself
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!hasAnyManageRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <ShieldX className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-semibold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground text-center max-w-md">
          You don't have permission to access the management panel.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
