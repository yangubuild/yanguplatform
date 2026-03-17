import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ManagedEntity {
  id: string;
  surface_id: string | null;
  entity_type: string;
  entity_subtype: string;
  title: string;
  short_description: string | null;
  primary_category: string | null;
  tags: string[];
  visibility_tier: string;
  is_searchable: boolean;
  is_published: boolean;
  is_verified: boolean;
  is_ad_eligible: boolean;
  domain_host: string | null;
  slug: string | null;
  industry: string | null;
  surface_type: string | null;
  builder_surface_type: string | null;
  cover_image_url: string | null;
  created_at: string;
  published_at: string | null;
  total_count: number;
}

export function useManageEntities(entityType?: string, searchableOnly = false) {
  return useQuery({
    queryKey: ["manage", "entities", entityType, searchableOnly],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)(
        "manage_searchable_entities",
        {
          p_limit: 200,
          p_offset: 0,
          p_entity_type: entityType ?? null,
          p_searchable_only: searchableOnly,
        }
      );
      if (error) throw error;
      return (data ?? []) as ManagedEntity[];
    },
    staleTime: 30_000,
    retry: 1,
  });
}
