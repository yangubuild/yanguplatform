import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";

type DbAppRole = Database["public"]["Enums"]["app_role"];

export type AppRole = DbAppRole;
export type ManageRole = AppRole | "writer" | "analyst" | "moderator" | "content_editor";
export type AgencyRole = "agency_admin" | "agency_manager" | "foot_soldier" | "finance_officer" | "creator" | "influencer";

interface RolesState {
  roles: AppRole[];
  manageRoles: ManageRole[];
  agencyRoles: AgencyRole[];
  isAdmin: boolean;
  isOwner: boolean;
  isManager: boolean;
  isWriter: boolean;
  isDesigner: boolean;
  isAnalyst: boolean;
  isModerator: boolean;
  isContentEditor: boolean;
  isAgencyAdmin: boolean;
  isAgencyManager: boolean;
  isFootSoldier: boolean;
  isFinanceOfficer: boolean;
  isCreator: boolean;
  isInfluencer: boolean;
  hasAnyManageRole: boolean;
  hasAnyAgencyRole: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const MANAGE_ROLES: ManageRole[] = ["admin", "owner", "manager", "writer", "designer", "analyst", "moderator", "content_editor"];
const DB_MANAGE_ROLES: AppRole[] = ["admin", "owner", "manager", "designer"];
const AGENCY_ROLE_KEYS: AgencyRole[] = ["agency_admin", "agency_manager", "foot_soldier", "finance_officer", "creator", "influencer"];
const ALL_KNOWN_ROLES: string[] = ["admin", "user", "owner", "manager", "designer", "agency_admin", "agency_manager", "foot_soldier", "finance_officer", "creator", "influencer"];

export function useRoles(): RolesState {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [manageRoles, setManageRoles] = useState<ManageRole[]>([]);
  const [agencyRoles, setAgencyRoles] = useState<AgencyRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedOnce = useRef(false);

  const fetchRoles = useCallback(async () => {
    if (!user?.id) {
      setRoles([]);
      setManageRoles([]);
      setAgencyRoles([]);
      setIsLoading(false);
      return;
    }

    // Only show loading state on initial fetch — subsequent refetches are silent
    if (!hasFetchedOnce.current) {
      setIsLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;

      const assigned = new Set<string>();
      for (const row of data || []) {
        assigned.add(row.role as string);
      }

      // Base roles
      const resolvedRoles: AppRole[] = ["user"];
      for (const role of ["admin", "owner", "manager", "designer"] as const) {
        if (assigned.has(role)) resolvedRoles.push(role);
      }

      // Management roles
      const resolvedManageRoles = MANAGE_ROLES.filter(
        (role) => DB_MANAGE_ROLES.includes(role as AppRole) && assigned.has(role as string)
      ) as ManageRole[];

      // Agency roles
      const resolvedAgencyRoles = AGENCY_ROLE_KEYS.filter(
        (role) => assigned.has(role)
      );

      setRoles(resolvedRoles);
      setManageRoles(resolvedManageRoles);
      setAgencyRoles(resolvedAgencyRoles);
    } catch (err) {
      console.error("Failed to fetch roles:", err);
      setRoles(["user"]);
      setManageRoles([]);
      setAgencyRoles([]);
    } finally {
      hasFetchedOnce.current = true;
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setRoles([]);
      setManageRoles([]);
      setAgencyRoles([]);
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
  const isAgencyAdmin = agencyRoles.includes("agency_admin");
  const isAgencyManager = agencyRoles.includes("agency_manager");
  const isFootSoldier = agencyRoles.includes("foot_soldier");
  const isFinanceOfficer = agencyRoles.includes("finance_officer");
  const isCreator = agencyRoles.includes("creator");
  const isInfluencer = agencyRoles.includes("influencer");
  const hasAnyManageRole = manageRoles.length > 0;
  const hasAnyAgencyRole = agencyRoles.length > 0;

  return {
    roles,
    manageRoles,
    agencyRoles,
    isAdmin,
    isOwner,
    isManager,
    isWriter,
    isDesigner,
    isAnalyst,
    isModerator,
    isContentEditor,
    isAgencyAdmin,
    isAgencyManager,
    isFootSoldier,
    isFinanceOfficer,
    isCreator,
    isInfluencer,
    hasAnyManageRole,
    hasAnyAgencyRole,
    isLoading: authLoading || isLoading,
    refetch: fetchRoles,
  };
}
