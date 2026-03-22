import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import type { Post } from "@/hooks/usePosts";

const PAGE_SIZE = 20;

/**
 * Fetches posts ONLY from followed accounts (excludes self) with infinite scroll.
 */
export function useFollowingPosts() {
  const { user } = useAuth();

  const query = useInfiniteQuery({
    queryKey: ["following-posts", user?.id],
    enabled: !!user,
    staleTime: 10_000,
    initialPageParam: 0,
    getNextPageParam: (lastPage: Post[], allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    queryFn: async ({ pageParam = 0 }): Promise<Post[]> => {
      if (!user) return [];

      const { data: followRows } = await supabase
        .from("follows" as any)
        .select("following_id")
        .eq("follower_id", user.id);

      const followedIds: string[] = (followRows ?? []).map((r: any) => r.following_id);
      if (followedIds.length === 0) return [];

      const { data, error } = await supabase
        .from("user_posts")
        .select("*")
        .in("user_id", followedIds)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);
      if (error) throw error;

      const posts = (data ?? []) as Post[];
      if (posts.length === 0) return [];

      const authorIds = [...new Set(posts.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, avatar_mode, avatar_emoji_key, username")
        .in("id", authorIds);
      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

      const postIds = posts.map(p => p.id);
      const [commentsRes, reactionsRes] = await Promise.all([
        supabase.from("post_comments").select("post_id").in("post_id", postIds),
        supabase.from("post_reactions").select("post_id, reaction_type, user_id").in("post_id", postIds),
      ]);

      const commentCounts: Record<string, number> = {};
      (commentsRes.data ?? []).forEach((c: any) => {
        commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
      });

      const likeCounts: Record<string, number> = {};
      const loveCounts: Record<string, number> = {};
      const userLiked: Record<string, boolean> = {};
      const userLoved: Record<string, boolean> = {};

      (reactionsRes.data ?? []).forEach((r: any) => {
        if (r.reaction_type === "like") {
          likeCounts[r.post_id] = (likeCounts[r.post_id] || 0) + 1;
          if (r.user_id === user.id) userLiked[r.post_id] = true;
        } else if (r.reaction_type === "love") {
          loveCounts[r.post_id] = (loveCounts[r.post_id] || 0) + 1;
          if (r.user_id === user.id) userLoved[r.post_id] = true;
        }
      });

      return posts.map(p => {
        const prof = profileMap[p.user_id];
        const resolvedAvatar = prof ? resolveAvatarUrl(prof) : null;
        return {
          ...p,
          author_name: prof?.display_name || prof?.username || "Unknown",
          author_avatar: resolvedAvatar || undefined,
          author_username: prof?.username || undefined,
          comment_count: commentCounts[p.id] || 0,
          like_count: likeCounts[p.id] || 0,
          love_count: loveCounts[p.id] || 0,
          user_liked: !!userLiked[p.id],
          user_loved: !!userLoved[p.id],
        };
      });
    },
  });

  // Flatten pages for backward compatibility
  const allPosts = query.data?.pages.flat() ?? [];

  return {
    data: allPosts,
    isLoading: query.isLoading,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
