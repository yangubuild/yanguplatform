import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Platform roles for management panel access control.
 * Currently only "admin" and "user" exist in the DB enum.
 * Additional roles (writer, designer, analyst, moderator) are checked
 * via has_role but will return false until the enum is extended.
 */
export type AppRole = "admin" | "user";
export type ManageRole = "admin" | "writer" | "designer" | "analyst" | "moderator";

interface RolesState {
  roles: AppRole[];
  manageRoles: ManageRole[];
  isAdmin: boolean;
  isOwner: boolean;
  isWriter: boolean;
  isDesigner: boolean;
  isAnalyst: boolean;
  isModerator: boolean;
  hasAnyManageRole: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const MANAGE_ROLES: ManageRole[] = ["admin", "writer", "designer", "analyst", "moderator"];

/**
 * Hook to fetch and manage user roles from the database.
 * Uses the `has_role` RPC to check each role.
 */
export function useRoles(): RolesState {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [manageRoles, setManageRoles] = useState<ManageRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!user?.id) {
      setRoles([]);
      setManageRoles([]);
      setIsLoading(false);
      return;
    }

    try {
      // Check admin role (always valid in current enum)
      const { data: hasAdmin, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (error) {
        console.error("Error fetching roles:", error);
        setRoles(["user"]);
        setManageRoles([]);
        setIsLoading(false);
        return;
      }

      const userRoles: AppRole[] = ["user"];
      const foundManageRoles: ManageRole[] = [];

      if (hasAdmin) {
        userRoles.push("admin");
        foundManageRoles.push("admin");
      }

      // Check additional manage roles (will return false until enum is extended)
      // We attempt each but swallow errors for roles not yet in the enum
      const additionalRoles: ManageRole[] = ["writer", "designer", "analyst", "moderator"];
      const checks = await Promise.allSettled(
        additionalRoles.map(async (role) => {
          try {
            const { data } = await supabase.rpc("has_role", {
              _user_id: user.id,
              _role: role as any,
            });
            return { role, has: !!data };
          } catch {
            return { role, has: false };
          }
        })
      );

      for (const result of checks) {
        if (result.status === "fulfilled" && result.value.has) {
          foundManageRoles.push(result.value.role);
        }
      }

      setRoles(userRoles);
      setManageRoles(foundManageRoles);
    } catch (err) {
      console.error("Failed to fetch roles:", err);
      setRoles(["user"]);
      setManageRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setRoles([]);
      setManageRoles([]);
      setIsLoading(false);
      return;
    }
    fetchRoles();
  }, [authLoading, isAuthenticated, fetchRoles]);

  const isAdmin = roles.includes("admin");
  const isOwner = isAdmin;
  const isWriter = manageRoles.includes("writer");
  const isDesigner = manageRoles.includes("designer");
  const isAnalyst = manageRoles.includes("analyst");
  const isModerator = manageRoles.includes("moderator");
  const hasAnyManageRole = manageRoles.length > 0;

  return {
    roles,
    manageRoles,
    isAdmin,
    isOwner,
    isWriter,
    isDesigner,
    isAnalyst,
    isModerator,
    hasAnyManageRole,
    isLoading: authLoading || isLoading,
    refetch: fetchRoles,
  };
}
