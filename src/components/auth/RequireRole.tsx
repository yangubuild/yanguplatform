import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { resolveUserType, UserType } from "@/config/dashboardNav";
import { Loader2 } from "lucide-react";

interface RequireRoleProps {
  allowed: UserType[];
  children: ReactNode;
  /** Where to redirect if role doesn't match. Defaults to /dashboard/dashboard/profile */
  redirectTo?: string;
}

/**
 * Route guard that redirects silently if the user's resolved role
 * is not in the allowed list.
 */
export function RequireRole({ allowed, children, redirectTo = "/dashboard/dashboard/profile" }: RequireRoleProps) {
  const { profile, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: rolesLoading } = useRoles();

  if (authLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
      </div>
    );
  }

  const userType = resolveUserType({ isAdmin, creatorType: profile?.creator_type });

  if (!allowed.includes(userType)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
