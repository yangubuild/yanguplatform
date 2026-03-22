import { useRef, useCallback } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { useToggleReaction, postHasCover } from "@/hooks/usePosts";
import { PostCard } from "@/components/posts/PostCard";

/**
 * Community posts section for the Explore page.
 * Shows recent posts from followed accounts + own posts (with cover images only).
 */
export function ExploreFeedPosts() {
  const { data: posts = [], isLoading } = useFeedPosts();
  const toggleReaction = useToggleReaction();

  // Only show posts with cover images in the explore feed
  const visiblePosts = posts.filter(postHasCover);

  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="text-base font-bold text-foreground mb-4">Recent Posts</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin" className="text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (visiblePosts.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-base font-bold text-foreground mb-4">Recent Posts</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visiblePosts.slice(0, 6).map((post) => (
          <PostCard key={post.id} post={post} toggleReaction={toggleReaction} />
        ))}
      </div>
    </div>
  );
}
