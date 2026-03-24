import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DataIntegrityResult {
  duplicate_emails: number;
  orphan_subscriptions: number;
  invalid_subscriptions: number;
  kyc_without_profile: number;
  referrals_without_agency: number;
}

export function useDataIntegrityCheck() {
  return useQuery({
    queryKey: ["manage", "data-integrity"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_data_integrity_check");
      if (error) throw error;
      return data as unknown as DataIntegrityResult;
    },
    staleTime: 60_000,
  });
}
