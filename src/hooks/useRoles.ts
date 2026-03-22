import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";

type DbAppRole = Database["public"]["Enums"]["app_role"];

export type AppRole = DbAppRole;
export type ManageRole = AppRole | "writer" | "analyst" | "moderator" | "content_editor";

interface RolesState {
  roles: AppRole[];
  manageRoles: ManageRole[];
  isAdmin: boolean;
  isOwner: boolean;
  isManager: boolean;
  isWriter: boolean;
  isDesigner: boolean;
  isAnalyst: boolean;
  isModerator: boolean;
  isContentEditor: boolean;
  hasAnyManageRole: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const MANAGE_ROLES: ManageRole[] = ["admin", "owner", "manager", "writer", "designer", "analyst", "moderator", "content_editor"];
const DB_MANAGE_ROLES: AppRole[] = ["admin", "owner", "manager", "designer"];
const DB_APP_ROLES: AppRole[] = ["admin", "owner", "manager", "designer", "user"];

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

    setIsLoading(true);

    try {
      // Read user's assigned roles directly to avoid enum-cast 400 RPC errors
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;

      const assigned = new Set<AppRole>();
      for (const row of data || []) {
        const role = row.role as AppRole;
        if (DB_APP_ROLES.includes(role)) assigned.add(role);
      }

      const resolvedRoles: AppRole[] = ["user"];
      for (const role of ["admin", "owner", "manager", "designer"] as const) {
        if (assigned.has(role)) resolvedRoles.push(role);
      }

      const resolvedManageRoles = MANAGE_ROLES.filter(
        (role) => DB_MANAGE_ROLES.includes(role as AppRole) && assigned.has(role as AppRole)
      ) as ManageRole[];

      setRoles(resolvedRoles);
      setManageRoles(resolvedManageRoles);
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
    void fetchRoles();
  }, [authLoading, isAuthenticated, fetchRoles]);

  const isAdmin = roles.includes("admin") || manageRoles.includes("admin");
  const isOwner = manageRoles.includes("owner") || isAdmin;
  const isManager = manageRoles.includes("manager");
  const isWriter = manageRoles.includes("writer");
  const isDesigner = manageRoles.includes("designer");
  const isAnalyst = manageRoles.includes("analyst");
  const isModerator = manageRoles.includes("moderator");
  const isContentEditor = manageRoles.includes("content_editor");
  const hasAnyManageRole = manageRoles.length> 0;

  return {
    roles,
    manageRoles,
    isAdmin,
    isOwner,
    isManager,
    isWriter,
    isDesigner,
    isAnalyst,
    isModerator,
    isContentEditor,
    hasAnyManageRole,
    isLoading: authLoading || isLoading,
    refetch: fetchRoles,
  };
}

