import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { resolveAvatarUrl } from "@/lib/avatarUtils";

export interface ProfileReview {
  id: string;
  entity_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
  reviewer_username?: string;
}

/**
 * Fetches reviews for a user's entities (surfaces owned by them).
 * Links: user → searchable_entities (owner_user_id) → entity_reviews (entity_id)
 */
export function useProfileReviews(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile-reviews", userId],
    enabled: !!userId,
    queryFn: async (): Promise<{ reviews: ProfileReview[]; avgRating: number; totalCount: number }> => {
      if (!userId) return { reviews: [], avgRating: 0, totalCount: 0 };

      // Get all entities owned by this user
      const { data: entities, error: entitiesErr } = await supabase
        .from("searchable_entities")
        .select("id")
        .eq("owner_user_id", userId);
      if (entitiesErr) throw entitiesErr;
      if (!entities?.length) return { reviews: [], avgRating: 0, totalCount: 0 };

      const entityIds = entities.map(e => e.id);

      // Get reviews for those entities
      const { data: reviews, error: reviewsErr } = await supabase
        .from("entity_reviews")
        .select("id, entity_id, user_id, rating, title, body, created_at")
        .in("entity_id", entityIds)
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (reviewsErr) throw reviewsErr;
      if (!reviews?.length) return { reviews: [], avgRating: 0, totalCount: 0 };

      // Fetch reviewer profiles
      const reviewerIds = [...new Set(reviews.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, avatar_mode, avatar_emoji_key, username")
        .in("id", reviewerIds);
      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

      const mapped: ProfileReview[] = reviews.map(r => {
        const p = profileMap[r.user_id];
        return {
          ...r,
          reviewer_name: p?.display_name || p?.username || "Anonymous",
          reviewer_avatar: p ? (resolveAvatarUrl(p) ?? undefined) : undefined,
          reviewer_username: p?.username || undefined,
        };
      });

      const avg = mapped.length > 0
        ? mapped.reduce((sum, r) => sum + r.rating, 0) / mapped.length
        : 0;

      return { reviews: mapped, avgRating: avg, totalCount: mapped.length };
    },
  });
}

/**
 * Submit a review for a user. Finds their first entity automatically.
 */
export function useSubmitProfileReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ targetUserId, rating, title, body }: {
      targetUserId: string;
      rating: number;
      title?: string;
      body?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Find entity to review
      const { data: entities } = await supabase
        .from("searchable_entities")
        .select("id")
        .eq("owner_user_id", targetUserId)
        .limit(1);

      let entityId = entities?.[0]?.id;

      // If no entity exists, we can't submit (need a surface first)
      if (!entityId) {
        throw new Error("This user has no reviewable entities yet");
      }

      const { error } = await supabase
        .from("entity_reviews")
        .insert({
          entity_id: entityId,
          user_id: user.id,
          rating,
          title: title?.trim() || null,
          body: body?.trim() || null,
        });

      if (error) {
        if (error.code === "23505") throw new Error("You've already reviewed this");
        throw error;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["profile-reviews", vars.targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["friend-reviews", vars.targetUserId] });
      toast.success("Review submitted!");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to submit review"),
  });
}
