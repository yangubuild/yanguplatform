import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { useToggleReaction, type Post } from "@/hooks/usePosts";
import { useFollowingPosts } from "@/hooks/useFollowingPosts";
import { PostCard } from "@/components/posts/PostCard";
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
    if (el.scrollTop + el.clientHeight>= el.scrollHeight - 200) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-sm font-semibold text-foreground">Following</span>
      </div>

      {/* Posts list — followed accounts only */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef} onScroll={handleScroll}>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10">
            <p className="text-sm font-semibold text-foreground">No posts from followed accounts</p>
            <p className="text-xs mt-1 text-muted-foreground">
              Follow people to see their posts here.
            </p>
          </div>
        ) : (
          <div className="px-3 py-2 space-y-2">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                toggleReaction={toggleReaction}
                onAuthorClick={onViewProfile ? (p) => {
                  onViewProfile({
                    id: p.user_id,
                    display_name: p.author_name || "Unknown",
                    avatar_url: p.author_avatar || null,
                    username: p.author_username || null,
                  } as FriendUser);
                } : undefined}
              />
            ))}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
