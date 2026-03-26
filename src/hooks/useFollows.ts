import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useRef, useCallback } from "react";
import { resolveAvatarUrl } from "@/lib/avatarUtils";

/** All query keys that depend on follow relationships */
const FOLLOW_QUERY_KEYS = [
  "is-following",
  "follow-counts",
  "following-posts",
  "feed-posts",
] as const;

function invalidateAllFollowQueries(
  qc: ReturnType<typeof useQueryClient>,
  currentUserId: string | undefined,
  targetUserId: string,
) {
  qc.invalidateQueries({ queryKey: ["is-following", currentUserId, targetUserId] });
  qc.invalidateQueries({ queryKey: ["follow-counts", targetUserId] });
  qc.invalidateQueries({ queryKey: ["follow-counts", currentUserId] });
  qc.invalidateQueries({ queryKey: ["following-posts"] });
  qc.invalidateQueries({ queryKey: ["feed-posts"] });
}

export function useIsFollowing(targetUserId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-following", user?.id, targetUserId],
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("follows" as any)
        .select("id", { count: "exact", head: true })
        .eq("follower_id", user!.id)
        .eq("following_id", targetUserId!);
      if (error) throw error;
      return (count ?? 0)> 0;
    },
  });
}

export function useFollowCounts(userId: string | undefined) {
  return useQuery({
    queryKey: ["follow-counts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from("follows" as any)
          .select("id", { count: "exact", head: true })
          .eq("following_id", userId!),
        supabase
          .from("follows" as any)
          .select("id", { count: "exact", head: true })
          .eq("follower_id", userId!),
      ]);
      return {
        followers: Math.max(0, followersRes.count ?? 0),
        following: Math.max(0, followingRes.count ?? 0),
      };
    },
  });
}

export function useToggleFollow() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const inflightRef = useRef(false);

  return useMutation({
    mutationFn: async ({
      targetUserId,
      isCurrentlyFollowing,
    }: {
      targetUserId: string;
      isCurrentlyFollowing: boolean;
    }) => {
      if (!user) throw new Error("Not logged in");
      if (user.id === targetUserId) throw new Error("Cannot follow yourself");
      if (inflightRef.current) return; // drop rapid duplicate clicks
      inflightRef.current = true;

      try {
        if (isCurrentlyFollowing) {
          const { error } = await supabase
            .from("follows" as any)
            .delete()
            .eq("follower_id", user.id)
            .eq("following_id", targetUserId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("follows" as any)
            .insert({ follower_id: user.id, following_id: targetUserId } as any);
          // Ignore unique constraint violation (duplicate follow)
          if (error && !error.message?.includes("duplicate key")) throw error;

          // Send follow notification to the target user
          const { data: myProfile } = await supabase
            .from("public_profile_view")
            .select("display_name, username, avatar_url, avatar_mode, avatar_emoji_key")
            .eq("id", user.id)
            .single();
          const name = myProfile?.display_name || myProfile?.username || "Someone";
          const uname = myProfile?.username ? `@${myProfile.username}` : "";
          const avatarUrl = myProfile ? resolveAvatarUrl(myProfile) : null;
          await supabase.from("notifications").insert({
            user_id: targetUserId,
            type: "follow",
            title: `${name} followed you`,
            body: `${name} ${uname} started following you on YANGU. Follow them back to stay connected!`,
            link: `/dashboard/home?view_profile=${user.id}`,
            is_read: false,
            metadata: { actor_id: user.id, actor_avatar: avatarUrl } as any,
          } as any);
        }
      } finally {
        inflightRef.current = false;
      }
    },
    onSuccess: (_, { targetUserId, isCurrentlyFollowing }) => {
      invalidateAllFollowQueries(qc, user?.id, targetUserId);
      toast.success(isCurrentlyFollowing ? "Unfollowed" : "Following");
    },
    onError: (err) => {
      if ((err as Error).message === "Cannot follow yourself") return;
      toast.error("Action failed");
    },
  });
}
