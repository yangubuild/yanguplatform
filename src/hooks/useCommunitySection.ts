import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CommunitySectionItem {
  surface_id: string;
  title: string;
  org_id: string;
  domain_host: string;
  slug: string;
  listed_at: string;
  cover_image: string | null;
  category: string | null;
  price_text: string | null;
  description: string | null;
}

export function useCommunitySection(
  section: string,
  categoryKey: string | null = null,
  limit = 12,
  offset = 0,
) {
  return useQuery({
    queryKey: ["community_section", section, categoryKey, limit, offset],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)(
        "get_community_section",
        {
          p_section: section,
          p_category_key: categoryKey,
          p_limit: limit,
          p_offset: offset,
        },
      );
      if (error) throw error;
      return (data ?? []) as CommunitySectionItem[];
    },
  });
}
