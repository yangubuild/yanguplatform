import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { useRef, useCallback } from "react";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  media_type: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar?: string;
  author_username?: string;
  comment_count?: number;
  like_count?: number;
  love_count?: number;
  user_liked?: boolean;
  user_loved?: boolean;
  /** Whether the post has a cover image (media) */
  has_cover?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  author_username?: string;
}

/** Canonical profile fields needed for post identity */
const PROFILE_AVATAR_SELECT = "id, display_name, avatar_url, avatar_mode, avatar_emoji_key, username";

/** Shared helper: aggregate comment counts & reaction state for a list of posts */
function aggregateInteractions(
  posts: Post[],
  commentsData: any[],
  reactionsData: any[],
  currentUserId: string | undefined
) {
  const commentCounts: Record<string, number> = {};
  commentsData.forEach((c: any) => {
    commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
  });

  const likeCounts: Record<string, number> = {};
  const loveCounts: Record<string, number> = {};
  const userLiked: Record<string, boolean> = {};
  const userLoved: Record<string, boolean> = {};

  reactionsData.forEach((r: any) => {
    if (r.reaction_type === "like") {
      likeCounts[r.post_id] = (likeCounts[r.post_id] || 0) + 1;
      if (currentUserId && r.user_id === currentUserId) userLiked[r.post_id] = true;
    } else if (r.reaction_type === "love") {
      loveCounts[r.post_id] = (loveCounts[r.post_id] || 0) + 1;
      if (currentUserId && r.user_id === currentUserId) userLoved[r.post_id] = true;
    }
  });

  return { commentCounts, likeCounts, loveCounts, userLiked, userLoved };
}

/** All query keys that contain posts */
const ALL_POST_QUERY_KEYS = ["user-posts", "feed-posts", "following-posts"] as const;

// ─── Scoped Cache Updaters ───────────────────────────────────────────────────

/**
 * Update a single post's field in ALL post list caches without refetching.
 * This is O(n) over cached posts but avoids network requests entirely.
 */
function updatePostInCache(
  queryClient: QueryClient,
  postId: string,
  updater: (post: Post) => Post
) {
  ALL_POST_QUERY_KEYS.forEach(key => {
    queryClient.setQueriesData<Post[] | { pages: Post[][] } | undefined>(
      { queryKey: [key] },
      (old) => {
        if (!old) return old;
        // Handle flat arrays (user-posts, feed-posts)
        if (Array.isArray(old)) {
          return old.map(p => p.id === postId ? updater(p) : p);
        }
        // Handle infinite query pages (following-posts)
        if ('pages' in old && Array.isArray(old.pages)) {
          return {
            ...old,
            pages: old.pages.map(page =>
              page.map(p => p.id === postId ? updater(p) : p)
            ),
          };
        }
        return old;
      }
    );
  });
}

/**
 * Increment a post's comment_count in cache without refetching.
 */
export function incrementCommentCount(queryClient: QueryClient, postId: string) {
  updatePostInCache(queryClient, postId, (p) => ({
    ...p,
    comment_count: (p.comment_count ?? 0) + 1,
  }));
}

/**
 * Update reaction state for a post in cache without refetching.
 */
function updateReactionInCache(
  queryClient: QueryClient,
  postId: string,
  reactionType: "like" | "love",
  isActive: boolean
) {
  updatePostInCache(queryClient, postId, (p) => {
    if (reactionType === "like") {
      return {
        ...p,
        user_liked: !isActive,
        like_count: Math.max(0, (p.like_count ?? 0) + (isActive ? -1 : 1)),
      };
    }
    return {
      ...p,
      user_loved: !isActive,
      love_count: Math.max(0, (p.love_count ?? 0) + (isActive ? -1 : 1)),
    };
  });
}

/**
 * Helper: returns true if a post has a valid cover image
 */
export function postHasCover(post: { media_urls?: string[] | null }): boolean {
  return !!(post.media_urls && post.media_urls.length > 0 && post.media_urls[0]);
}

export function useUserPosts(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-posts", userId],
    enabled: !!userId,
    staleTime: 10_000, // 10s — prevent refetch storms
    queryFn: async (): Promise<Post[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      const posts = (data ?? []) as Post[];
      if (posts.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select(PROFILE_AVATAR_SELECT)
        .eq("id", userId)
        .limit(1);
      const profile = profiles?.[0];

      const postIds = posts.map(p => p.id);
      const [commentsRes, reactionsRes] = await Promise.all([
        supabase.from("post_comments").select("post_id").in("post_id", postIds),
        supabase.from("post_reactions").select("post_id, reaction_type, user_id").in("post_id", postIds),
      ]);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const { commentCounts, likeCounts, loveCounts, userLiked, userLoved } = aggregateInteractions(
        posts, commentsRes.data ?? [], reactionsRes.data ?? [], currentUser?.id
      );

      const resolvedAvatar = profile ? resolveAvatarUrl(profile) : null;
      return posts.map(p => ({
        ...p,
        author_name: profile?.display_name || profile?.username || "Unknown",
        author_avatar: resolvedAvatar || undefined,
        author_username: profile?.username || undefined,
        comment_count: commentCounts[p.id] || 0,
        like_count: likeCounts[p.id] || 0,
        love_count: loveCounts[p.id] || 0,
        user_liked: !!userLiked[p.id],
        user_loved: !!userLoved[p.id],
      }));
    },
  });
}

export function usePostComments(postId: string | undefined) {
  return useQuery({
    queryKey: ["post-comments", postId],
    enabled: !!postId,
    staleTime: 5_000, // 5s — comments are relatively stable
    queryFn: async (): Promise<PostComment[]> => {
      if (!postId) return [];
      const { data, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;

      const comments = (data ?? []) as PostComment[];
      if (comments.length === 0) return [];

      const userIds = [...new Set(comments.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select(PROFILE_AVATAR_SELECT)
        .in("id", userIds);
      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

      return comments.map(c => {
        const prof = profileMap[c.user_id];
        const resolvedAvatar = prof ? resolveAvatarUrl(prof) : null;
        return {
          ...c,
          author_name: prof?.display_name || prof?.username || "Unknown",
          author_avatar: resolvedAvatar || undefined,
          author_username: prof?.username || undefined,
        };
      });
    },
  });
}

/**
 * Upload a file to post-media bucket, returns public URL
 */
export async function uploadPostMedia(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("post-media")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("post-media").getPublicUrl(path);
  return data.publicUrl;
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ content, mediaUrls, mediaType }: { content: string; mediaUrls?: string[]; mediaType?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const trimmed = content.trim();
      if (!trimmed && (!mediaUrls || mediaUrls.length === 0)) throw new Error("Post cannot be empty");
      const { data, error } = await supabase
        .from("user_posts")
        .insert({
          user_id: user.id,
          content: trimmed,
          media_urls: mediaUrls || [],
          media_type: mediaType || "text",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // New post creation: invalidate only own posts + feed posts (they contain own posts)
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      toast.success("Post published!");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create post"),
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");
      const trimmed = content.trim();
      if (!trimmed) throw new Error("Comment cannot be empty");
      const { data, error } = await supabase
        .from("post_comments")
        .insert({ post_id: postId, user_id: user.id, content: trimmed })
        .select()
        .single();
      if (error) throw error;

      // Send notification to post owner (non-blocking)
      const { data: post } = await supabase
        .from("user_posts")
        .select("user_id")
        .eq("id", postId)
        .single();
      if (post) {
        sendPostNotification({
          actorId: user.id,
          postOwnerId: post.user_id,
          postId,
          type: "post_comment",
          actionLabel: "commented on your post",
        });
      }

      return data;
    },
    onMutate: async (vars) => {
      // Optimistic: append comment to cache immediately
      if (!user) return;
      await queryClient.cancelQueries({ queryKey: ["post-comments", vars.postId] });

      const previousComments = queryClient.getQueryData<PostComment[]>(["post-comments", vars.postId]);
      const resolvedAvatar = profile ? resolveAvatarUrl(profile) : null;

      const optimisticComment: PostComment = {
        id: `optimistic-${Date.now()}`,
        post_id: vars.postId,
        user_id: user.id,
        content: vars.content.trim(),
        created_at: new Date().toISOString(),
        author_name: profile?.display_name || profile?.username || "You",
        author_avatar: resolvedAvatar || undefined,
        author_username: profile?.username || undefined,
      };

      queryClient.setQueryData<PostComment[]>(
        ["post-comments", vars.postId],
        (old) => [...(old ?? []), optimisticComment]
      );

      // Also increment comment_count in post caches
      incrementCommentCount(queryClient, vars.postId);

      return { previousComments };
    },
    onError: (_err, vars, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(["post-comments", vars.postId], context.previousComments);
      }
    },
    onSettled: (_data, _error, vars) => {
      // Refetch comments to get server-confirmed data (replaces optimistic IDs)
      queryClient.invalidateQueries({ queryKey: ["post-comments", vars.postId] });
    },
  });
}

/**
 * Send a social notification (like/love/comment) to a post owner.
 * Skips self-notifications and deduplicates within 60s.
 */
async function sendPostNotification({
  actorId,
  postOwnerId,
  postId,
  type,
  actionLabel,
}: {
  actorId: string;
  postOwnerId: string;
  postId: string;
  type: "post_like" | "post_love" | "post_comment";
  actionLabel: string;
}) {
  if (actorId === postOwnerId) return; // no self-notifications
  try {
    const { data: actor } = await supabase
      .from("profiles")
      .select("display_name, username, avatar_url, avatar_mode, avatar_emoji_key")
      .eq("id", actorId)
      .single();
    const name = actor?.display_name || actor?.username || "Someone";
    const avatarUrl = actor ? resolveAvatarUrl(actor) : null;
    await supabase.from("notifications").insert({
      user_id: postOwnerId,
      type,
      title: `${name} ${actionLabel}`,
      body: `Tap to view the post`,
      link: `/dashboard/home?post=${postId}`,
      is_read: false,
      metadata: { post_id: postId, actor_id: actorId, actor_avatar: avatarUrl } as any,
    } as any);
  } catch { /* non-critical */ }
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const inflightRef = useRef<Set<string>>(new Set());

  const mutationFn = useCallback(async ({ postId, reactionType, isActive }: { postId: string; reactionType: "like" | "love"; isActive: boolean }) => {
    if (!user) throw new Error("Not authenticated");

    const key = `${postId}:${reactionType}`;
    if (inflightRef.current.has(key)) return;
    inflightRef.current.add(key);

    try {
      if (isActive) {
        await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .eq("reaction_type", reactionType);
      } else {
        await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .eq("reaction_type", reactionType);
        await supabase
          .from("post_reactions")
          .insert({ post_id: postId, user_id: user.id, reaction_type: reactionType });

        // Send notification to post owner (non-blocking)
        const { data: post } = await supabase
          .from("user_posts")
          .select("user_id")
          .eq("id", postId)
          .single();
        if (post) {
          sendPostNotification({
            actorId: user.id,
            postOwnerId: post.user_id,
            postId,
            type: reactionType === "like" ? "post_like" : "post_love",
            actionLabel: reactionType === "like" ? "liked your post" : "loved your post",
          });
        }
      }
    } finally {
      inflightRef.current.delete(key);
    }
  }, [user]);

  return useMutation({
    mutationFn,
    onMutate: (vars) => {
      // Scoped optimistic update — no full feed refetch
      updateReactionInCache(queryClient, vars.postId, vars.reactionType, vars.isActive);
    },
    // No onSuccess invalidation — optimistic state is sufficient
    // Server state will sync on next natural query refresh (staleTime)
  });
}
