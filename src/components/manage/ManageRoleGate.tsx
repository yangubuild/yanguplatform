import { ReactNode } from "react";
import { ShieldX } from "lucide-react";
import { useRoles, ManageRole } from "@/hooks/useRoles";

interface ManageRoleGateProps {
  /** Roles that grant access to this section. Admin always has access. */
  allowedRoles: ManageRole[];
  children: ReactNode;
}

/**
 * Renders children only if the user has one of the allowed manage roles.
 * Admin always passes. Shows an access-denied message inside AdminShell otherwise.
 */
export function ManageRoleGate({ allowedRoles, children }: ManageRoleGateProps) {
  const { manageRoles, isAdmin } = useRoles();

  // Admin bypasses all gates
  if (isAdmin) return <>{children}</>;

  const hasAccess = manageRoles.some((r) => allowedRoles.includes(r));

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <ShieldX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          You don't have permission to access this section.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
