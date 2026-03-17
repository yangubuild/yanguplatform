import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ManagedSurface {
  id: string;
  title: string;
  surface_type: string;
  status: string;
  created_at: string;
  draft_slug: string | null;
  org_name: string | null;
  domain_host: string | null;
}

export function useManageSurfaces() {
  return useQuery({
    queryKey: ["manage", "surfaces"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_surfaces_list");
      if (error) throw error;
      return (data as unknown as ManagedSurface[]) ?? [];
    },
    staleTime: 30_000,
    retry: 1,
  });
}
