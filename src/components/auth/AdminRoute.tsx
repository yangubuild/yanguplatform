import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { Loader2, ShieldX } from "lucide-react";

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * Gate for /manage. Allows any user with at least one manage-level role.
 * Currently "admin" and "content_editor" are supported.
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasAnyManageRole, isContentEditor, isAdmin, isLoading: rolesLoading } = useRoles();
  const location = useLocation();

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
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

  // content_editor landing on /manage root → redirect to content home
  if (isContentEditor && !isAdmin && location.pathname === "/manage") {
    return <Navigate to="/manage/content" replace />;
  }

  return <>{children}</>;
}
