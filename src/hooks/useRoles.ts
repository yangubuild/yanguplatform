import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { createElement } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";

type DbAppRole = Database["public"]["Enums"]["app_role"];

export type AppRole = DbAppRole;
export type ManageRole = AppRole | "writer" | "analyst" | "moderator" | "content_editor" | "engineer" | "sales_marketing" | "finance_lead" | "support_lead" | "social_digital";
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

const MANAGE_ROLES: ManageRole[] = ["admin", "owner", "manager", "writer", "designer", "analyst", "moderator", "content_editor", "engineer", "sales_marketing", "finance_lead", "support_lead", "social_digital"];
const DB_MANAGE_ROLES: AppRole[] = ["admin", "owner", "manager", "designer", "engineer", "sales_marketing", "finance_lead", "support_lead", "social_digital"];
const AGENCY_ROLE_KEYS: AgencyRole[] = ["agency_admin", "agency_manager", "foot_soldier", "finance_officer", "creator", "influencer"];

const defaultState: RolesState = {
  roles: [],
  manageRoles: [],
  agencyRoles: [],
  isAdmin: false,
  isOwner: false,
  isManager: false,
  isWriter: false,
  isDesigner: false,
  isAnalyst: false,
  isModerator: false,
  isContentEditor: false,
  isAgencyAdmin: false,
  isAgencyManager: false,
  isFootSoldier: false,
  isFinanceOfficer: false,
  isCreator: false,
  isInfluencer: false,
  hasAnyManageRole: false,
  hasAnyAgencyRole: false,
  isLoading: true,
  refetch: async () => {},
};

const RolesContext = createContext<RolesState>(defaultState);

export function RolesProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [manageRoles, setManageRoles] = useState<ManageRole[]>([]);
  const [agencyRoles, setAgencyRoles] = useState<AgencyRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedForUser = useRef<string | null>(null);
  // Track in-flight fetch to deduplicate
  const fetchPromise = useRef<Promise<void> | null>(null);

  const fetchRoles = useCallback(async () => {
    if (!user?.id) {
      setRoles([]);
      setManageRoles([]);
      setAgencyRoles([]);
      setIsLoading(false);
      hasFetchedForUser.current = null;
      return;
    }

    // If we already fetched for this exact user, skip loading state (silent refresh)
    const isFirstFetch = hasFetchedForUser.current !== user.id;
    if (isFirstFetch) {
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

      const resolvedRoles: AppRole[] = ["user"];
      for (const role of ["admin", "owner", "manager", "designer"] as const) {
        if (assigned.has(role)) resolvedRoles.push(role);
      }

      const resolvedManageRoles = MANAGE_ROLES.filter(
        (role) => DB_MANAGE_ROLES.includes(role as AppRole) && assigned.has(role as string)
      ) as ManageRole[];

      const resolvedAgencyRoles = AGENCY_ROLE_KEYS.filter(
        (role) => assigned.has(role)
      );

      setRoles(resolvedRoles);
      setManageRoles(resolvedManageRoles);
      setAgencyRoles(resolvedAgencyRoles);
      hasFetchedForUser.current = user.id;
    } catch (err) {
      console.error("Failed to fetch roles:", err);
      setRoles(["user"]);
      setManageRoles([]);
      setAgencyRoles([]);
    } finally {
      setIsLoading(false);
      fetchPromise.current = null;
    }
  }, [user?.id]);

  // Deduplicated refetch for external callers
  const refetch = useCallback(async () => {
    if (fetchPromise.current) {
      await fetchPromise.current;
      return;
    }
    const p = fetchRoles();
    fetchPromise.current = p;
    await p;
  }, [fetchRoles]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setRoles([]);
      setManageRoles([]);
      setAgencyRoles([]);
      setIsLoading(false);
      hasFetchedForUser.current = null;
      return;
    }
    // Only fetch if we haven't already fetched for this user
    if (hasFetchedForUser.current === user?.id) return;
    void refetch();
  }, [authLoading, isAuthenticated, user?.id, refetch]);

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

  const value: RolesState = {
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
    refetch,
  };

  return createElement(RolesContext.Provider, { value }, children);
}

export function useRoles(): RolesState {
  return useContext(RolesContext);
}
