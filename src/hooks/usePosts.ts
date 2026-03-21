import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { resolveAvatarUrl } from "@/lib/avatarUtils";

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

export function useUserPosts(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-posts", userId],
    enabled: !!userId,
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
        .select("id, display_name, avatar_url, avatar_mode, avatar_emoji_key, username")
        .eq("id", userId)
        .limit(1);
      const profile = profiles?.[0];

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
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      (reactionsRes.data ?? []).forEach((r: any) => {
        if (r.reaction_type === "like") {
          likeCounts[r.post_id] = (likeCounts[r.post_id] || 0) + 1;
          if (currentUser && r.user_id === currentUser.id) userLiked[r.post_id] = true;
        } else if (r.reaction_type === "love") {
          loveCounts[r.post_id] = (loveCounts[r.post_id] || 0) + 1;
          if (currentUser && r.user_id === currentUser.id) userLoved[r.post_id] = true;
        }
      });

      return posts.map(p => {
        const resolvedAvatar = profile ? resolveAvatarUrl(profile) : null;
        return {
          ...p,
          author_name: profile?.display_name || profile?.username || "Unknown",
          author_avatar: resolvedAvatar || undefined,
          author_username: profile?.username || undefined,
        comment_count: commentCounts[p.id] || 0,
        like_count: likeCounts[p.id] || 0,
        love_count: loveCounts[p.id] || 0,
          user_liked: !!userLiked[p.id],
          user_loved: !!userLoved[p.id],
        };
      });
    },
  });
}

export function usePostComments(postId: string | undefined) {
  return useQuery({
    queryKey: ["post-comments", postId],
    enabled: !!postId,
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
        .select("id, display_name, avatar_url, avatar_mode, avatar_emoji_key, username")
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
      const { data, error } = await supabase
        .from("user_posts")
        .insert({
          user_id: user.id,
          content,
          media_urls: mediaUrls || [],
          media_type: mediaType || "text",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-posts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      toast.success("Post published!");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create post"),
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("post_comments")
        .insert({ post_id: postId, user_id: user.id, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", vars.postId] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      toast.success("Comment added!");
    },
    onError: () => toast.error("Failed to add comment"),
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, reactionType, isActive }: { postId: string; reactionType: "like" | "love"; isActive: boolean }) => {
      if (!user) throw new Error("Not authenticated");
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
          .insert({ post_id: postId, user_id: user.id, reaction_type: reactionType });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    },
  });
}
