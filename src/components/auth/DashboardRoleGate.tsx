import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";

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
  const { profile } = useAuth();

  // rolesLoading already includes authLoading — no need to check both
  if (rolesLoading) {
    return null; // Shell stays mounted; content appears when ready
  }

  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/dashboard/profile" replace />;
  }

  if (requiredRole === "agency" && profile?.creator_type !== "organization") {
    return <Navigate to="/dashboard/profile" replace />;
  }

  return <>{children}</>;
}
