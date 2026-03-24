import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgencyDashboardData {
  agency: Record<string, unknown> | null;
  total_members: number;
  total_referrals: number;
  kyc_pending: number;
  kyc_approved: number;
  kyc_rejected: number;
  active_subscribers: number;
  phase1_total_cents: number;
  phase2_total_cents: number;
  total_earned_cents: number;
  pending_cents: number;
  converted_referrals: number;
  churned_referrals: number;
}

export function useAgencyDashboard(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency", "dashboard", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_agency_dashboard_v2", { p_agency_id: agencyId! });
      if (error) throw error;
      return data as unknown as AgencyDashboardData;
    },
    enabled: !!agencyId,
    staleTime: 30_000,
  });
}

export function useMyAgencyStats(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency", "my-stats", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_agency_stats", { p_agency_id: agencyId! });
      if (error) throw error;
      return data as unknown as {
        my_referrals: number;
        my_converted: number;
        my_kyc_approved: number;
        my_total_earned_cents: number;
        my_pending_cents: number;
        my_phase1_cents: number;
        my_phase2_cents: number;
      };
    },
    enabled: !!agencyId,
    staleTime: 30_000,
  });
}
