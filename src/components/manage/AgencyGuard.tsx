import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { useRoles, AgencyRole } from "@/hooks/useRoles";

interface AgencyGuardProps {
  allowedRoles?: AgencyRole[];
  children: ReactNode;
}

export function AgencyGuard({ allowedRoles, children }: AgencyGuardProps) {
  const { isAdmin, hasAnyAgencyRole, isAgencyAdmin, agencyRoles } = useRoles();

  if (isAdmin) return <>{children}</>;
  if (isAgencyAdmin) return <>{children}</>;

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = agencyRoles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <ShieldX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            You don't have permission to access this section.
          </p>
          <Link to="/" className="text-sm text-accent hover:underline mt-2">
            ← Back to Dashboard
          </Link>
        </div>
      );
    }
  }

  if (!hasAnyAgencyRole) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
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
