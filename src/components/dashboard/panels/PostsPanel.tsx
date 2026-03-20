import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ImagePlus, Video, Sparkles, Send, Heart, MessageSquare, ThumbsUp, Loader2 } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { useUserPosts, useCreatePost, useToggleReaction, type Post } from "@/hooks/usePosts";

export function PostsPanel() {
  const { user, profile } = useAuth();
  const [text, setText] = useState("");
  const { data: posts = [], isLoading } = useUserPosts(user?.id);
  const createPost = useCreatePost();
  const toggleReaction = useToggleReaction();

  const avatarUrl = profile ? resolveAvatarUrl(profile) : null;
  const initials = (profile?.display_name || "U").slice(0, 2).toUpperCase();

  const handlePost = () => {
    if (!text.trim()) return;
    createPost.mutate({ content: text.trim() });
    setText("");
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-white">Posts</span>
      </div>

      {/* Composer */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <span className="text-white/60">{initials}</span>
            )}
          </div>
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share a product, service, or update..."
              className="w-full bg-transparent text-sm text-white placeholder:text-white/25 outline-none resize-none min-h-[60px]"
              onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handlePost(); }}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-md hover:bg-white/5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <ImagePlus className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-white/5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <Video className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-white/5" style={{ color: "#E67E22" }} title="AI Generate">
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handlePost}
                disabled={!text.trim() || createPost.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity"
                style={{
                  background: text.trim() ? "linear-gradient(135deg, #b5622a, #5c2a12)" : "rgba(255,255,255,0.08)",
                  color: text.trim() ? "#fff" : "rgba(255,255,255,0.35)",
                }}
              >
                {createPost.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10">
            <div
              className="w-full max-w-sm rounded-xl p-5 mb-4"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 rounded" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <div className="h-2 w-20 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
                <div className="h-3 w-4/5 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>
            </div>
            <p className="text-sm font-semibold text-white">No posts yet</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              Share your first product, service, or update!
            </p>
          </div>
        ) : (
          <div className="px-3 py-2 space-y-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onReact={(type, active) => toggleReaction.mutate({ postId: post.id, reactionType: type, isActive: active })} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, onReact }: { post: Post; onReact: (type: "like" | "love", active: boolean) => void }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
          {post.author_avatar ? (
            <img src={post.author_avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 flex items-center justify-center text-[10px] font-bold text-white/60">
              {(post.author_name || "U").slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{post.author_name}</p>
          {post.author_username && (
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>@{post.author_username}</p>
          )}
        </div>
        <span className="text-[10px] shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
          {new Date(post.created_at).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-white whitespace-pre-wrap mb-2">{post.content}</p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onReact("like", !!post.user_liked)}
          className="flex items-center gap-1 text-[11px]"
          style={{ color: post.user_liked ? "#3b82f6" : "rgba(255,255,255,0.35)" }}
        >
          <ThumbsUp className="w-3.5 h-3.5" /> {post.like_count || ""}
        </button>
        <button
          onClick={() => onReact("love", !!post.user_loved)}
          className="flex items-center gap-1 text-[11px]"
          style={{ color: post.user_loved ? "#ef4444" : "rgba(255,255,255,0.35)" }}
        >
          <Heart className="w-3.5 h-3.5" /> {post.love_count || ""}
        </button>
        <span className="flex items-center gap-1 text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
          <MessageSquare className="w-3.5 h-3.5" /> {post.comment_count || ""}
        </span>
      </div>
    </div>
  );
}
