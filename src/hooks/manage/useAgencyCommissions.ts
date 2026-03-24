import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Commission {
  id: string;
  agency_id: string;
  member_user_id: string;
  referral_id: string | null;
  phase: string;
  amount_cents: number;
  currency: string;
  status: string;
  triggered_at: string;
  paid_at: string | null;
  payout_id: string | null;
}

export function useAgencyCommissions(agencyId: string | undefined, userId?: string) {
  return useQuery({
    queryKey: ["agency", "commissions", agencyId, userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_commissions", {
        p_agency_id: agencyId!,
        ...(userId ? { p_user_id: userId } : {}),
      });
      if (error) throw error;
      return (data as unknown as Commission[]) ?? [];
    },
    enabled: !!agencyId,
    staleTime: 30_000,
  });
}
