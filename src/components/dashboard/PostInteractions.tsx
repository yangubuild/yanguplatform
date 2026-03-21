import { useState } from "react";
import { Heart, ThumbsUp, MessageSquare, ExternalLink, Loader2, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { usePostComments, useCreateComment, type Post } from "@/hooks/usePosts";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { useQuery } from "@tanstack/react-query";

interface PostInteractionsProps {
  post: Post;
  toggleReaction: { mutate: (args: { postId: string; reactionType: "like" | "love"; isActive: boolean }) => void };
}

/**
 * Fetches profile info for users who reacted to a post.
 */
function useReactionUsers(postId: string, reactionType: "like" | "love", enabled: boolean) {
  return useQuery({
    queryKey: ["reaction-users", postId, reactionType],
    enabled,
    queryFn: async () => {
      const { data: reactions } = await supabase
        .from("post_reactions")
        .select("user_id")
        .eq("post_id", postId)
        .eq("reaction_type", reactionType);
      if (!reactions || reactions.length === 0) return [];
      const userIds = [...new Set(reactions.map((r: any) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, avatar_mode, avatar_emoji_key")
        .in("id", userIds);
      return (profiles ?? []).map((p: any) => ({
        id: p.id,
        name: p.display_name || p.username || "Unknown",
        username: p.username,
        avatar: resolveAvatarUrl(p),
      }));
    },
  });
}

export function PostInteractions({ post, toggleReaction }: PostInteractionsProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showLikers, setShowLikers] = useState(false);
  const [showLovers, setShowLovers] = useState(false);
  const [commentText, setCommentText] = useState("");
  const { data: comments = [], isLoading: commentsLoading } = usePostComments(showComments ? post.id : undefined);
  const createComment = useCreateComment();
  const { data: likers = [] } = useReactionUsers(post.id, "like", showLikers);
  const { data: lovers = [] } = useReactionUsers(post.id, "love", showLovers);

  const handleComment = () => {
    if (!commentText.trim()) return;
    createComment.mutate({ postId: post.id, content: commentText.trim() });
    setCommentText("");
  };

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => toggleReaction.mutate({ postId: post.id, reactionType: "like", isActive: !!post.user_liked })}
            onMouseEnter={() => (post.like_count ?? 0) > 0 && setShowLikers(true)}
            onMouseLeave={() => setShowLikers(false)}
            className="flex items-center gap-1 text-[11px]"
            style={{ color: post.user_liked ? "#3b82f6" : "rgba(255,255,255,0.35)" }}
          >
            <ThumbsUp className="w-3.5 h-3.5" /> {post.like_count || ""}
          </button>
          {showLikers && likers.length > 0 && (
            <ReactionPopover users={likers} />
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => toggleReaction.mutate({ postId: post.id, reactionType: "love", isActive: !!post.user_loved })}
            onMouseEnter={() => (post.love_count ?? 0) > 0 && setShowLovers(true)}
            onMouseLeave={() => setShowLovers(false)}
            className="flex items-center gap-1 text-[11px]"
            style={{ color: post.user_loved ? "#ef4444" : "rgba(255,255,255,0.35)" }}
          >
            <Heart className="w-3.5 h-3.5" /> {post.love_count || ""}
          </button>
          {showLovers && lovers.length > 0 && (
            <ReactionPopover users={lovers} />
          )}
        </div>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-[11px]"
          style={{ color: showComments ? "#a78bfa" : "rgba(255,255,255,0.35)" }}
        >
          <MessageSquare className="w-3.5 h-3.5" /> {post.comment_count || ""}
        </button>
        <button className="flex items-center gap-1 text-[11px] ml-auto" style={{ color: "rgba(255,255,255,0.35)" }} title="Share">
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {commentsLoading ? (
            <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-white/30" /></div>
          ) : comments.length > 0 ? (
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
                    {c.author_avatar ? (
                      <img src={c.author_avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 flex items-center justify-center text-[8px] font-bold text-white/50">
                        {(c.author_name || "U").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] font-semibold text-white">{c.author_name}</span>
                      {c.author_username && <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>@{c.author_username}</span>}
                    </div>
                    <p className="text-[11px] text-white/70">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-white/30 mb-2">No comments yet</p>
          )}
          <div className="flex items-center gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleComment(); }}
              placeholder="Write a comment..."
              className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 outline-none px-2 py-1.5 rounded-md"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
            <button
              onClick={handleComment}
              disabled={!commentText.trim() || createComment.isPending}
              className="text-[10px] font-semibold px-2 py-1 rounded-md"
              style={{ color: commentText.trim() ? "#a78bfa" : "rgba(255,255,255,0.2)" }}
            >
              {createComment.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReactionPopover({ users }: { users: { id: string; name: string; username: string | null; avatar: string | null }[] }) {
  return (
    <div
      className="absolute bottom-full left-0 mb-1 z-50 rounded-lg p-2 min-w-[140px] max-w-[200px] shadow-xl"
      style={{ background: "#1a1f28", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {users.slice(0, 10).map((u) => (
        <div key={u.id} className="flex items-center gap-2 py-1">
          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
            {u.avatar ? (
              <img src={u.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 flex items-center justify-center text-[8px] font-bold text-white/50">{u.name.slice(0, 2).toUpperCase()}</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-white truncate">{u.name}</p>
            {u.username && <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>@{u.username}</p>}
          </div>
        </div>
      ))}
      {users.length > 10 && <p className="text-[9px] text-white/30 mt-1">+{users.length - 10} more</p>}
    </div>
  );
}
