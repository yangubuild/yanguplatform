import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LandingCounters {
  earned: number;
  users: number;
  businesses: number;
}

/**
 * Pull real platform counters from manage_overview_stats RPC.
 * Falls back to zeros (the display component will animate up).
 * Admin can update real values via management panel.
 */
export function useLandingCounters() {
  return useQuery<LandingCounters>({
    queryKey: ["landing-counters"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_overview_stats");
      if (error) throw error;
      const stats = data as Record<string, number> | null;
      return {
        earned: 0, // Revenue counter not yet wired — deferred to billing phase
        users: stats?.total_users ?? 0,
        businesses: stats?.total_surfaces ?? 0,
      };
    },
    staleTime: 120_000,
    retry: 1,
  });
}
