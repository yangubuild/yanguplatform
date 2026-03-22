import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface DashboardRoleGateProps {
  children: ReactNode;
  /** "admin" uses role check; "agency" checks creator_type === "organization" */
  requiredRole: "admin" | "agency";
}

/**
 * Silently redirects to /dashboard/profile if user lacks the required role.
 */
export function DashboardRoleGate({ children, requiredRole }: DashboardRoleGateProps) {
  const { isAdmin, isLoading: rolesLoading } = useRoles();
  const { profile, isLoading: authLoading } = useAuth();

  if (authLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/dashboard/profile" replace />;
  }

  if (requiredRole === "agency" && profile?.creator_type !== "organization") {
    return <Navigate to="/dashboard/profile" replace />;
  }

  return <>{children}</>;
}
