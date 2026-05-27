import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LandingCounters {
  earned: number;
  users: number;
  businesses: number;
  communities: number;
}

/**
 * Pull real platform counters from get_platform_stats RPC (public, no auth required).
 * Single source of truth for user/shop/community counts across all surfaces.
 */
export function useLandingCounters() {
  return useQuery<LandingCounters>({
    queryKey: ["landing-counters"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_platform_stats" as any);
      if (error) throw error;
      const stats = (data as Record<string, number> | null) ?? null;
      return {
        earned: 0,
        users: stats?.total_users ?? 0,
        businesses: stats?.total_shops ?? 0,
        communities: stats?.total_communities ?? 0,
      };
    },
    staleTime: 120_000,
    retry: 1,
  });
}
