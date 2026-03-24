import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CommunityPromo {
  id: string;
  section: string;
  category_key: string | null;
  tier: number;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  surface_title: string | null;
}

export function useManageCommunity() {
  return useQuery({
    queryKey: ["manage", "community-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_community_promotions");
      if (error) throw error;
      return (data as unknown as CommunityPromo[]) ?? [];
    },
    staleTime: 15_000,
    retry: 1,
  });
}
