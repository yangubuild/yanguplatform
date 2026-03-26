import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { incrementCommentCount, type PostComment } from "@/hooks/usePosts";

/**
 * Subscribe to realtime INSERT events on post_comments for a specific post.
 * Appends new comments from OTHER users to the cache without refetching.
 * Deduplicates against optimistic inserts by checking existing IDs.
 */
export function useRealtimeComments(postId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!postId) return;

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`post-comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "post_comments",
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const newComment = payload.new as any;
          if (!newComment?.id) return;

          // Skip if this is our own comment (already handled by optimistic insert)
          if (user && newComment.user_id === user.id) return;

          // Check for duplicates in cache
          const existing = queryClient.getQueryData<PostComment[]>(["post-comments", postId]);
          if (existing?.some(c => c.id === newComment.id)) return;

          // Resolve the commenter's profile
          let authorName = "Unknown";
          let authorAvatar: string | undefined;
          let authorUsername: string | undefined;

          try {
            const { data: profiles } = await supabase
              .from("public_profile_view")
              .select("id, display_name, avatar_url, avatar_mode, avatar_emoji_key, username")
              .eq("id", newComment.user_id)
              .limit(1);
            const prof = profiles?.[0];
            if (prof) {
              authorName = prof.display_name || prof.username || "Unknown";
              authorAvatar = resolveAvatarUrl(prof) || undefined;
              authorUsername = prof.username || undefined;
            }
          } catch { /* graceful fallback */ }

          const enrichedComment: PostComment = {
            id: newComment.id,
            post_id: newComment.post_id,
            user_id: newComment.user_id,
            content: newComment.content,
            created_at: newComment.created_at,
            author_name: authorName,
            author_avatar: authorAvatar,
            author_username: authorUsername,
          };

          // Append to comment cache
          queryClient.setQueryData<PostComment[]>(
            ["post-comments", postId],
            (old) => {
              if (!old) return [enrichedComment];
              // Final dedup check
              if (old.some(c => c.id === newComment.id)) return old;
              return [...old, enrichedComment];
            }
          );

          // Increment comment count in post caches
          incrementCommentCount(queryClient, postId);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [postId, user?.id, queryClient]);
}
