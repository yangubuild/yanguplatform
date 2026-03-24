import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { useRoles, AgencyRole } from "@/hooks/useRoles";

interface AgencyGuardProps {
  /** Agency roles that grant access. agency_admin always has access. */
  allowedRoles?: AgencyRole[];
  children: ReactNode;
}

/**
 * Guards agency workspace routes.
 * Platform admins always pass. Otherwise requires explicit agency role.
 */
export function AgencyGuard({ allowedRoles, children }: AgencyGuardProps) {
  const { isAdmin, hasAnyAgencyRole, isAgencyAdmin, agencyRoles } = useRoles();

  // Platform admin bypasses
  if (isAdmin) return <>{children}</>;

  // Agency admin bypasses sub-role checks
  if (isAgencyAdmin) return <>{children}</>;

  // Check specific role restriction if provided
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = agencyRoles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <ShieldX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            You don't have permission to access this section.
          </p>
          <Link to="/agency" className="text-sm text-accent hover:underline mt-2">
            ← Back to Agency Dashboard
          </Link>
        </div>
      );
    }
  }

  // Must have at least some agency role
  if (!hasAnyAgencyRole) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <ShieldX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          You need an agency role to access this workspace.
        </p>
        <Link to="/" className="text-sm text-accent hover:underline mt-2">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
