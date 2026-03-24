import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NewsArticle {
  id: string;
  content: string;
  media_urls: string[] | null;
  media_type: string | null;
  created_at: string;
  author_username: string | null;
  author_name: string | null;
}

export function useManageNews() {
  return useQuery({
    queryKey: ["manage", "news-articles"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_news_articles");
      if (error) throw error;
      return (data as unknown as NewsArticle[]) ?? [];
    },
    staleTime: 15_000,
    retry: 1,
  });
}
