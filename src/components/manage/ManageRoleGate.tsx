import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { useRoles, ManageRole } from "@/hooks/useRoles";
import { manageLink } from "@/lib/routing/managePathUtils";

interface ManageRoleGateProps {
  /** Roles that grant access to this section. Admin always has access. */
  allowedRoles: ManageRole[];
  children: ReactNode;
}

/**
 * Renders children only if the user has one of the allowed manage roles.
 * Admin always passes. Shows an access-denied message with a back link otherwise.
 */
export function ManageRoleGate({ allowedRoles, children }: ManageRoleGateProps) {
  const { manageRoles, isAdmin, isContentEditor } = useRoles();

  if (isAdmin) return <>{children}</>;

  const hasAccess = manageRoles.some((r) => allowedRoles.includes(r));

  if (!hasAccess) {
    const backTo = isContentEditor ? "/manage/content" : "/manage";
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <ShieldX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          You don't have permission to access this section.
        </p>
        <Link to={backTo} className="text-sm text-accent hover:underline mt-2">
          ← Back to {isContentEditor ? "Content Engine" : "Dashboard"}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
