import { useState } from "react";
import { Heart, MessageSquare, Send, Loader2, ThumbsUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { useUserPosts, usePostComments, useCreateComment, useToggleReaction } from "@/hooks/usePosts";
import type { FriendUser } from "../FriendProfileView";

interface Props {
  friend: FriendUser;
}

export function FriendPostsRightPanel({ friend }: Props) {
  const { profile } = useAuth();
  const [comment, setComment] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const avatarUrl = profile ? resolveAvatarUrl(profile) : null;
  const initials = (profile?.display_name || "U").slice(0, 2).toUpperCase();
  const friendName = friend.display_name || friend.username || "Unnamed";

  const { data: posts = [] } = useUserPosts(friend.id);
  const { data: comments = [], isLoading: commentsLoading } = usePostComments(selectedPostId ?? undefined);
  const createComment = useCreateComment();

  // Auto-select first post if none selected
  const activePostId = selectedPostId || posts[0]?.id || null;
  const activeComments = selectedPostId ? comments : [];

  const handleSendComment = () => {
    if (!comment.trim() || !activePostId) return;
    createComment.mutate({ postId: activePostId, content: comment.trim() });
    setComment("");
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-white">Comments</span>
      </div>

      {/* Post selector */}
      {posts.length > 0 && (
        <div className="px-3 py-2 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[10px] mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Select a post:</p>
          <div className="space-y-1 max-h-[120px] overflow-y-auto">
            {posts.slice(0, 10).map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedPostId(post.id)}
                className="w-full text-left rounded-md px-2 py-1.5 text-xs transition-colors truncate"
                style={{
                  background: activePostId === post.id ? "rgba(181,98,42,0.15)" : "rgba(255,255,255,0.03)",
                  color: activePostId === post.id ? "#E67E22" : "rgba(255,255,255,0.6)",
                  border: `1px solid ${activePostId === post.id ? "rgba(181,98,42,0.3)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                {post.content.slice(0, 60)}{post.content.length > 60 ? "…" : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comments area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!activePostId ? (
          <div className="flex flex-col items-center justify-center py-8">
            <MessageSquare className="w-8 h-8 mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
            <p className="text-sm text-white mb-1">No comments yet</p>
            <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
              {posts.length === 0 ? `${friendName} hasn't posted yet.` : "Select a post to see comments."}
            </p>
          </div>
        ) : commentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
        ) : activeComments.length === 0 && !selectedPostId ? (
          <div className="flex flex-col items-center justify-center py-8">
            <MessageSquare className="w-8 h-8 mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
            <p className="text-sm text-white mb-1">No comments yet</p>
            <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
              Select a post to see and add comments.
            </p>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <MessageSquare className="w-6 h-6 mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>No comments on this post yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
                  {c.author_avatar ? (
                    <img src={c.author_avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 flex items-center justify-center text-[9px] font-bold text-white/50">
                      {(c.author_name || "U").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white">
                    {c.author_name}
                    {c.author_username && <span className="font-normal ml-1" style={{ color: "rgba(255,255,255,0.35)" }}>@{c.author_username}</span>}
                  </p>
                  <p className="text-xs text-white/70 mt-0.5">{c.content}</p>
                  <p className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment input */}
      {activePostId && (
        <div className="shrink-0 px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-white/60">{initials}</span>
              )}
            </div>
            <div
              className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSendComment(); }}
                placeholder="Write a comment..."
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/25"
              />
              <button
                onClick={handleSendComment}
                disabled={!comment.trim() || createComment.isPending}
                className="p-1 rounded"
                style={{ color: comment.trim() ? "#E67E22" : "rgba(255,255,255,0.2)" }}
              >
                {createComment.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
