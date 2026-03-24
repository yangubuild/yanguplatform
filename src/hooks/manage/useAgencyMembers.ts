import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgencyMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  referral_count: number;
  commission_total: number;
}

export function useAgencyMembersList(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency", "members", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_agency_members", { p_agency_id: agencyId! });
      if (error) throw error;
      return (data as unknown as AgencyMember[]) ?? [];
    },
    enabled: !!agencyId,
    staleTime: 30_000,
  });
}
