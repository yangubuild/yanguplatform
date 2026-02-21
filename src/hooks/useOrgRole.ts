import { useActiveOrg } from "./useActiveOrg";

/**
 * Check if user has org owner/admin role (write access to developer console).
 */
export function useOrgRole() {
  const { data: activeOrg, isLoading } = useActiveOrg();

  const canWrite = !!activeOrg && ["owner", "admin"].includes(activeOrg.role);
  const canRead = !!activeOrg;

  return { activeOrg, isLoading, canWrite, canRead };
}
