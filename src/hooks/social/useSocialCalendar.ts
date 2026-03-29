import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "./queryKeys";
import { postLifecycleService } from "@/services/socialMedia";
import type { SocialPost } from "@/types/socialMedia";

export function useSocialCalendar(month: string) {
  const { user } = useAuth();

  // month format: "2026-03"
  const startDate = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const endDate = new Date(y, m, 0).toISOString().split("T")[0];

  const query = useQuery({
    queryKey: socialKeys.calendar(month),
    enabled: !!user,
    queryFn: async (): Promise<SocialPost[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("social_posts")
        .select("*")
        .eq("created_by", user.id)
        .or(`status.eq.scheduled,status.eq.published`)
        .gte("scheduled_for", startDate)
        .lte("scheduled_for", endDate + "T23:59:59")
        .order("scheduled_for", { ascending: true });

      if (error) throw error;
      return (data || []).map(postLifecycleService.mapToPost);
    },
  });

  return {
    posts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
