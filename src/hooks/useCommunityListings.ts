import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CommunityListing {
  surface_id: string;
  title: string;
  org_id: string;
  domain_host: string;
  slug: string;
  listed_at: string;
  cover_image: string | null;
  category: string | null;
}

export function useCommunityListings(limit = 24, offset = 0) {
  return useQuery({
    queryKey: ["community_listings_feed", limit, offset],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)(
        "get_community_listings",
        { p_limit: limit, p_offset: offset }
      );
      if (error) throw error;
      return (data ?? []) as CommunityListing[];
    },
  });
}
