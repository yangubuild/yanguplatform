import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AnthropicPublication {
  id: string;
  title: string;
  url: string;
  published_at: string | null;
  image_url: string | null;
  category: string | null;
  image_source: string;
  excerpt: string | null;
}

export function useAnthropicPublications(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ["anthropic-publications", limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_anthropic_publications", {
        p_limit: limit,
        p_offset: offset,
      });
      if (error) throw error;
      return (data || []) as AnthropicPublication[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
