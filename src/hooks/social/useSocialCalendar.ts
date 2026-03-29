import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "./queryKeys";
import { postLifecycleService } from "@/services/socialMedia";
import type { SocialPost } from "@/types/socialMedia";

export function useSocialCalendar(startDate: string, endDate: string, showDrafts: boolean) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: [...socialKeys.calendar(startDate), endDate, showDrafts],
    enabled: !!user,
    queryFn: async (): Promise<SocialPost[]> => {
      if (!user) return [];

      const statuses = showDrafts
        ? "status.eq.scheduled,status.eq.published,status.eq.publishing,status.eq.failed,status.eq.draft"
        : "status.eq.scheduled,status.eq.published,status.eq.publishing,status.eq.failed";

      const { data, error } = await supabase
        .from("social_posts")
        .select("*")
        .eq("created_by", user.id)
        .or(statuses)
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
    refetch: query.refetch,
  };
}
