import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "./queryKeys";
import type { SocialHomeSummary } from "@/types/socialMedia";

export function useSocialHomeSummary() {
  const { user } = useAuth();

  return useQuery({
    queryKey: socialKeys.homeSummary(),
    enabled: !!user,
    queryFn: async (): Promise<SocialHomeSummary> => {
      if (!user) throw new Error("Not authenticated");

      // Parallel fetches
      const [
        onboardingRes,
        accountsRes,
        draftsRes,
        scheduledRes,
        publishedRes,
        topicsRes,
        profileRes,
        analyticsRes,
      ] = await Promise.all([
        supabase
          .from("social_onboarding")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("social_connected_accounts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "active"),
        supabase
          .from("social_posts")
          .select("id", { count: "exact", head: true })
          .eq("created_by", user.id)
          .eq("status", "draft"),
        supabase
          .from("social_posts")
          .select("id", { count: "exact", head: true })
          .eq("created_by", user.id)
          .eq("status", "scheduled"),
        supabase
          .from("social_posts")
          .select("id", { count: "exact", head: true })
          .eq("created_by", user.id)
          .eq("status", "published"),
        supabase
          .from("social_topics")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("social_brand_profiles")
          .select("tone")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("social_analytics_snapshots")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      const onboarding = onboardingRes.data;

      return {
        onboarding_progress: {
          completed_steps: (onboarding?.completed_steps as string[]) || [],
          total_steps: 5,
          is_completed: onboarding?.is_completed ?? false,
        },
        connected_accounts_count: accountsRes.count || 0,
        drafts_count: draftsRes.count || 0,
        scheduled_count: scheduledRes.count || 0,
        published_count: publishedRes.count || 0,
        topics_count: topicsRes.count || 0,
        library_items_count: 0,
        ai_profile_complete: !!profileRes.data?.tone,
        analytics_ready: (analyticsRes.count || 0) > 0,
      };
    },
  });
}
