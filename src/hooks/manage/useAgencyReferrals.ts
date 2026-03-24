import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgencyReferral {
  id: string;
  referred_user_id: string;
  referred_by_user_id: string;
  source: string;
  status: string;
  created_at: string;
  converted_at: string | null;
  referred_name: string | null;
  referred_email: string | null;
  soldier_name: string | null;
  kyc_status: string;
}

export function useAgencyReferrals(agencyId: string | undefined, userId?: string) {
  return useQuery({
    queryKey: ["agency", "referrals", agencyId, userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_agency_referrals", {
        p_agency_id: agencyId!,
        ...(userId ? { p_user_id: userId } : {}),
      });
      if (error) throw error;
      return (data as unknown as AgencyReferral[]) ?? [];
    },
    enabled: !!agencyId,
    staleTime: 30_000,
  });
}
