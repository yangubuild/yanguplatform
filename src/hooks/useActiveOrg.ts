import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface OrgMembership {
  org_id: string;
  role: string;
  created_at: string;
  org: {
    id: string;
    name: string;
  };
}

export interface ActiveOrg {
  id: string;
  name: string;
  role: string;
}

/**
 * Hook to get the user's active organization
 * Returns the most recently joined org membership for the current user
 */
export function useActiveOrg() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["active-org", user?.id],
    queryFn: async (): Promise<ActiveOrg | null> => {
      if (!user) return null;

      // Get user's org memberships, ordered by most recent
      const { data, error } = await supabase
        .from("org_memberships")
        .select(`
          org_id,
          role,
          created_at,
          orgs!inner (
            id,
            name
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching active org:", error);
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.org_id,
        name: data.orgs.name,
        role: data.role,
      };
    },
    enabled: isAuthenticated && !!user,
  });
}

/**
 * Hook to get all organizations the user is a member of
 */
export function useUserOrgs() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["user-orgs", user?.id],
    queryFn: async (): Promise<OrgMembership[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("org_memberships")
        .select(`
          org_id,
          role,
          created_at,
          orgs!inner (
            id,
            name
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user orgs:", error);
        throw error;
      }

      return (data || []).map((m) => ({
        org_id: m.org_id,
        role: m.role,
        created_at: m.created_at,
        org: {
          id: m.orgs.id,
          name: m.orgs.name,
        },
      }));
    },
    enabled: isAuthenticated && !!user,
  });
}
