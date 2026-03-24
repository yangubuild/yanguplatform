import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgencyOverview {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  total_members: number;
  total_referrals: number;
  kyc_completed: number;
  active_subscribers: number;
  total_revenue_cents: number;
  pending_commissions_cents: number;
}

export function useAgenciesOverview() {
  return useQuery({
    queryKey: ["manage", "agencies-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_agencies_overview");
      if (error) throw error;
      return (data as unknown as AgencyOverview[]) ?? [];
    },
    staleTime: 30_000,
  });
}
