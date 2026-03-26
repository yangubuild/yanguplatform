import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { manageLink } from "@/lib/routing/managePathUtils";
import { useRoles } from "@/hooks/useRoles";
import { YanguLoader } from "@/components/YanguLoader";
import { ShieldX } from "lucide-react";

/** Emails that are always allowed into the management panel */
const ALLOWED_ADMIN_EMAILS = [
  "yanguabuild@gmail.com",
  "kafeeroaz@gmail.com",
];

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * Gate for /manage. Allows any user with at least one manage-level role
 * OR whose email is in the allowlist.
 * Redirects unauthenticated users to /auth/login?returnTo=/manage...
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasAnyManageRole, isContentEditor, isAdmin, isLoading: rolesLoading } = useRoles();
  const location = useLocation();

  const emailAllowed = !!user?.email && ALLOWED_ADMIN_EMAILS.includes(user.email.toLowerCase());
  const hasAccess = emailAllowed || hasAnyManageRole;

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <YanguLoader size={40} fullArea={false} />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?returnTo=${returnTo}`} replace />;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <ShieldX className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-semibold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground text-center max-w-md">
          You don't have permission to access the management panel.
          Contact an administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  // content_editor landing on /manage root → redirect to content home
  if (isContentEditor && !isAdmin && location.pathname === "/manage") {
    return <Navigate to={manageLink("content")} replace />;
  }

  return <>{children}</>;
}
