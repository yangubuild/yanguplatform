import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { setActiveContext } from "@/lib/routing/activeContext";
import { Loader2, ShieldX } from "lucide-react";

const ALLOWED_ADMIN_EMAILS = [
  "yanguabuild@gmail.com",
  "kafeeroaz@gmail.com",
];

interface ManagementGuardProps {
  children: ReactNode;
}

export function ManagementGuard({ children }: ManagementGuardProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    hasAnyManageRole,
    hasAnyAgencyRole,
    isAdmin,
    isContentEditor,
    isLoading: rolesLoading,
  } = useRoles();
  const location = useLocation();

  const emailAllowed = !!user?.email && ALLOWED_ADMIN_EMAILS.includes(user.email.toLowerCase());
  const hasAccess = emailAllowed || hasAnyManageRole || hasAnyAgencyRole;

  useEffect(() => {
    if (isAuthenticated && hasAccess) {
      setActiveContext("management");
    }
  }, [isAuthenticated, hasAccess]);

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

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4">
        <ShieldX className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-semibold text-foreground">Access Restricted</h1>
        <p className="text-muted-foreground text-center max-w-md">
          You don't have permission to access the control panel.
          Contact an administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  // Root "/" — management-only users should go to /management
  if (location.pathname === "/" && (emailAllowed || hasAnyManageRole) && !hasAnyAgencyRole) {
    return <Navigate to="/management" replace />;
  }

  return <>{children}</>;
}
