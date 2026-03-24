import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
}

export interface SearchResults {
  users: SearchResult[];
  surfaces: SearchResult[];
  incidents: SearchResult[];
  tickets: SearchResult[];
}

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ["manage", "global-search", query],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_global_search", { p_query: query, p_limit: 20 });
      if (error) throw error;
      return data as unknown as SearchResults;
    },
    enabled: query.length >= 2,
    staleTime: 5_000,
  });
}
