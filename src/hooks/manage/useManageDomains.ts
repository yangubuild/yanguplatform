import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ManagedDomain {
  id: string;
  host: string;
  domain_type: string;
  kind: string;
  is_active: boolean;
  platform_key: string | null;
  created_at: string;
  owner_org_id: string | null;
  points_to_surface_publish_id: string | null;
}

export function useManageDomains() {
  return useQuery({
    queryKey: ["manage", "domains"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_domains_list");
      if (error) throw error;
      return (data as unknown as ManagedDomain[]) ?? [];
    },
    staleTime: 60_000,
    retry: 1,
  });
}
