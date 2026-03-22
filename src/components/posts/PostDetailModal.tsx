import { useEffect } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { PostCard } from "@/components/posts/PostCard";
import { useToggleReaction, type Post } from "@/hooks/usePosts";

interface PostDetailModalProps {
  postId: string;
  onClose: () => void;
  /** If true, auto-open comments section */
  showComments?: boolean;
}

function useSinglePost(postId: string) {
  return useQuery({
    queryKey: ["single-post", postId],
    enabled: !!postId,
    staleTime: 10_000,
    queryFn: async (): Promise<Post | null> => {
      const { data, error } = await supabase
        .from("user_posts")
        .select("*")
        .eq("id", postId)
        .single();
      if (error || !data) return null;

      const post = data as Post;

      // Fetch author profile
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, avatar_mode, avatar_emoji_key, username")
        .eq("id", post.user_id)
        .limit(1);
      const profile = profiles?.[0];

      // Fetch interactions
      const [commentsRes, reactionsRes] = await Promise.all([
        supabase.from("post_comments").select("id", { count: "exact", head: true }).eq("post_id", postId),
        supabase.from("post_reactions").select("post_id, reaction_type, user_id").eq("post_id", postId),
      ]);

      const { data: { user: currentUser } } = await supabase.auth.getUser();

      let likeCount = 0, loveCount = 0, userLiked = false, userLoved = false;
      (reactionsRes.data ?? []).forEach((r: any) => {
        if (r.reaction_type === "like") {
          likeCount++;
          if (currentUser && r.user_id === currentUser.id) userLiked = true;
        } else if (r.reaction_type === "love") {
          loveCount++;
          if (currentUser && r.user_id === currentUser.id) userLoved = true;
        }
      });

      const resolvedAvatar = profile ? resolveAvatarUrl(profile) : null;
      return {
        ...post,
        author_name: profile?.display_name || profile?.username || "Unknown",
        author_avatar: resolvedAvatar || undefined,
        author_username: profile?.username || undefined,
        comment_count: commentsRes.count ?? 0,
        like_count: likeCount,
        love_count: loveCount,
        user_liked: userLiked,
        user_loved: userLoved,
      };
    },
  });
}

export function PostDetailModal({ postId, onClose }: PostDetailModalProps) {
  const { data: post, isLoading } = useSinglePost(postId);
  const toggleReaction = useToggleReaction();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl"
        style={{ background: "#0F141A", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: "#0F141A", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Post</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : post ? (
            <PostCard post={post} toggleReaction={toggleReaction} />
          ) : (
            <div className="text-center py-12">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Post not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
