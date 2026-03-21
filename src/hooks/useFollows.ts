import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
      return (count ?? 0) > 0;
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
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
      };
    },
  });
}

export function useToggleFollow() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, isCurrentlyFollowing }: { targetUserId: string; isCurrentlyFollowing: boolean }) => {
      if (!user) throw new Error("Not logged in");
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
        if (error) throw error;

        // Send follow notification to the target user
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("display_name, username")
          .eq("id", user.id)
          .single();
        const name = myProfile?.display_name || myProfile?.username || "Someone";
        const uname = myProfile?.username ? `@${myProfile.username}` : "";
        await supabase.from("notifications").insert({
          user_id: targetUserId,
          type: "follow",
          title: `${name} followed you`,
          body: `${name} ${uname} started following you on YANGU. Follow them back to stay connected!`,
          link: `/dashboard/home`,
          is_read: false,
        } as any);
      }
    },
    onSuccess: (_, { targetUserId, isCurrentlyFollowing }) => {
      qc.invalidateQueries({ queryKey: ["is-following", user?.id, targetUserId] });
      qc.invalidateQueries({ queryKey: ["follow-counts", targetUserId] });
      qc.invalidateQueries({ queryKey: ["follow-counts", user?.id] });
      qc.invalidateQueries({ queryKey: ["following-posts"] });
      qc.invalidateQueries({ queryKey: ["feed-posts"] });
      toast.success(isCurrentlyFollowing ? "Unfollowed" : "Following");
    },
    onError: () => toast.error("Action failed"),
  });
}
