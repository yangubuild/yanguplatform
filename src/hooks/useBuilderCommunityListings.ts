import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BuilderCommunityListing {
  surface_id: string;
  title: string;
  description: string | null;
  slug: string;
  metadata: Record<string, unknown>;
  surface_type: string;
  published_at: string | null;
}

export function useBuilderCommunityListings(limit = 24, offset = 0, enabled = true) {
  return useQuery({
    queryKey: ["builder_community_listings", limit, offset],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)(
        "get_builder_community_listings",
        { p_limit: limit, p_offset: offset }
      );
      if (error) throw error;
      return (data ?? []) as BuilderCommunityListing[];
    },
    enabled,
  });
}
