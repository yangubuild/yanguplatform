import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ImagePlus, Video, Sparkles, Send, Loader2, X } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { useCreatePost, useToggleReaction, uploadPostMedia, type Post } from "@/hooks/usePosts";
import { useFollowingPosts } from "@/hooks/useFollowingPosts";
import { PostInteractions } from "@/components/dashboard/PostInteractions";
import { toast } from "sonner";
import type { FriendUser } from "@/components/dashboard/FriendProfileView";

interface PostsPanelProps {
  onViewProfile?: (user: FriendUser) => void;
}

export function PostsPanel({ onViewProfile }: PostsPanelProps) {
  const { user, profile } = useAuth();
  const { data: posts = [], isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFollowingPosts();
  const toggleReaction = useToggleReaction();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-white">Following</span>
      </div>

      {/* Posts list — followed accounts only */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef} onScroll={handleScroll}>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10">
            <p className="text-sm font-semibold text-white">No posts from followed accounts</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              Follow people to see their posts here.
            </p>
          </div>
        ) : (
          <div className="px-3 py-2 space-y-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-lg p-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className={`flex items-center gap-2 mb-2 ${onViewProfile ? "cursor-pointer" : ""}`}
                  onClick={onViewProfile ? () => {
                    onViewProfile({
                      id: post.user_id,
                      display_name: post.author_name || "Unknown",
                      avatar_url: post.author_avatar || null,
                      username: post.author_username || null,
                    } as FriendUser);
                  } : undefined}
                >
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

                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="mb-2 rounded-lg overflow-hidden">
                    {post.media_type === "video" ? (
                      <video src={post.media_urls[0]} controls className="w-full max-h-48 object-cover rounded-lg" />
                    ) : (
                      <div className="flex gap-1 flex-wrap">
                        {post.media_urls.map((url, i) => (
                          <img key={i} src={url} alt="" className="rounded-lg object-cover max-h-48" style={{ maxWidth: post.media_urls.length > 1 ? "48%" : "100%" }} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <PostInteractions post={post} toggleReaction={toggleReaction} />
              </div>
            ))}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
