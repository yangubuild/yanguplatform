import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Types ──

export interface ExploreSurfaceEntry {
  id: string;
  title: string;
  entity_type: string;
  category: string | null;
  visibility_tier: string;
  is_verified: boolean;
  trust_score: number;
  fill_source: string;
  owner_email: string | null;
  manual_position: number | null;
}

export interface ExploreUsersStats {
  total_users: number;
  published_users: number;
  active_publishers: number;
}

export interface ExploreSurfacesStats {
  total_surfaces: number;
  published_surfaces: number;
  unpublished_surfaces: number;
}

// ── Hooks ──

/**
 * Fetch all surfaces feeding the Explore surface.
 */
export function useExploreSurfaces() {
  return useQuery({
    queryKey: ["manage", "explore-surfaces"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_explore_surfaces" as any);
      if (error) throw error;
      return (data ?? []) as unknown as ExploreSurfaceEntry[];
    },
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Fetch user statistics for the Explore dashboard.
 */
export function useExploreUsersStats() {
  return useQuery({
    queryKey: ["manage", "explore-users-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_explore_users_stats" as any);
      if (error) throw error;
      return (data as unknown as ExploreUsersStats) ?? { total_users: 0, published_users: 0, active_publishers: 0 };
    },
    staleTime: 60_000,
    retry: 1,
  });
}

/**
 * Fetch surface statistics.
 */
export function useExploreSurfacesStats() {
  return useQuery({
    queryKey: ["manage", "explore-surfaces-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_explore_surfaces_stats" as any);
      if (error) throw error;
      return (data as unknown as ExploreSurfacesStats) ?? { total_surfaces: 0, published_surfaces: 0, unpublished_surfaces: 0 };
    },
    staleTime: 60_000,
    retry: 1,
  });
}

/**
 * Save manual ordering overrides for Explore surfaces.
 */
export function useSaveManualOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderings: { entity_id: string; position: number }[]) => {
      const { error } = await supabase.rpc("manage_save_explore_order" as any, {
        p_orderings: orderings,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "explore-surfaces"] });
    },
  });
}
