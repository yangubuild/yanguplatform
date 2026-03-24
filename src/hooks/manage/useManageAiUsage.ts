import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AiCategoryStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
}

interface TopUser {
  user_id: string;
  email: string | null;
  username: string | null;
  image_count: number;
  video_count: number;
  total_generations: number;
}

interface DailyTrend {
  day: string;
  images: number;
  videos: number;
}

interface AiUsageData {
  image_stats: AiCategoryStats;
  video_stats: AiCategoryStats;
  top_users: TopUser[];
  daily_trend: DailyTrend[];
}

export function useManageAiUsage(days = 30) {
  return useQuery({
    queryKey: ["manage", "ai-usage", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_ai_usage_stats", {
        p_days: days,
        p_limit: 50,
      });
      if (error) throw error;
      return data as unknown as AiUsageData;
    },
    staleTime: 30_000,
    retry: 1,
  });
}

export type { AiCategoryStats, TopUser, DailyTrend, AiUsageData };
