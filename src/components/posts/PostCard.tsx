import { useState } from "react";
import { EmojiRenderer } from "@/components/emoji/EmojiRenderer";
import { PostInteractions } from "@/components/dashboard/PostInteractions";
import type { Post } from "@/hooks/usePosts";
import { X } from "lucide-react";

interface PostCardProps {
  post: Post;
  toggleReaction: { mutate: (args: { postId: string; reactionType: "like" | "love"; isActive: boolean }) => void };
  /** When true, clicking the author header triggers onAuthorClick */
  onAuthorClick?: (post: Post) => void;
  /** Compact mode for sidebar panels */
  compact?: boolean;
}

/** Shared post card — used across Profile, Dashboard, and feed panels */
export function PostCard({ post, toggleReaction, onAuthorClick, compact }: PostCardProps) {
  const [showBuyPopup, setShowBuyPopup] = useState(false);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const hasBuyNow = post.content.includes("[cta:buynow]");
  const hasJoinNow = post.content.includes("[cta:joinnow]");
  const displayContent = post.content.replace(/\n?\[cta:(buynow|joinnow)\]/g, "").trim();

  return (
    <div
      className="rounded-lg p-3 sm:p-4"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Author header */}
      <div
        className={`flex items-center gap-2 mb-2 ${onAuthorClick ? "cursor-pointer" : ""}`}
        onClick={onAuthorClick ? () => onAuthorClick(post) : undefined}>
        <div
          className="w-8 h-8 rounded-full overflow-hidden shrink-0"
          style={{ background: "rgba(255,255,255,0.1)" }}>
          {post.author_avatar ? (
            <img src={post.author_avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
              {(post.author_name || "U").slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{post.author_name}</p>
          {post.author_username && (
            <p className="text-[10px] text-muted-foreground">
              @{post.author_username}
            </p>
          )}
        </div>
        <span className="text-[10px] shrink-0 text-muted-foreground">
          {formatRelativeTime(post.created_at)}
        </span>
      </div>

      {/* Content */}
      <div className="text-sm text-foreground whitespace-pre-wrap mb-2 break-words">
        <EmojiRenderer text={displayContent} />
      </div>

      {/* Media — cover image / video */}
      {post.media_urls && post.media_urls.length> 0 && (
        <div className="mb-2 rounded-lg overflow-hidden">
          {post.media_type === "video" ? (
            <video
              src={post.media_urls[0]}
              controls
              className="w-full max-h-[300px] object-cover rounded-lg"
            />
          ) : (
            <div className={`flex gap-1 ${post.media_urls.length> 1 ? "flex-wrap" : ""}`}>
              {post.media_urls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="rounded-lg object-cover"
                  style={{
                    maxHeight: "300px",
                    width: post.media_urls.length> 1 ? "calc(50% - 2px)" : "100%" }}
                  loading="lazy"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* CTA buttons */}
      {(hasBuyNow || hasJoinNow) && (
        <div className="flex items-center gap-2 mb-2">
          {hasBuyNow && (
            <button
              onClick={() => setShowBuyPopup(true)}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors min-h-[36px]"
              style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
              Buy Now
            </button>
          )}
          {hasJoinNow && (
            <button
              onClick={() => setShowJoinPopup(true)}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors min-h-[36px]"
              style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" }}>
              Join Now
            </button>
          )}
        </div>
      )}

      {/* Interactions */}
      <PostInteractions post={post} toggleReaction={toggleReaction} />

      {/* CTA popups */}
      {showBuyPopup && (
        <CtaPopup
          title="Complete Purchase"
          description="This item is available for purchase. Payment integration coming soon."
          onClose={() => setShowBuyPopup(false)}
          color="#10b981"
        />
      )}
      {showJoinPopup && (
        <CtaPopup
          title="Join Service / Community"
          description="Join this service or community. Membership setup coming soon."
          onClose={() => setShowJoinPopup(false)}
          color="#3b82f6"
        />
      )}
    </div>
  );
}

function CtaPopup({ title, description, onClose, color }: { title: string; description: string; onClose: () => void; color: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="rounded-xl p-5 w-full max-w-[300px] shadow-2xl" style={{ background: "#1a1f28", border: `1px solid ${color}40` }}>
        <h3 className="text-sm font-bold text-foreground mb-2">{title}</h3>
        <p className="text-xs text-muted-foreground mb-4">{description}</p>
        <button onClick={onClose} className="w-full text-xs font-semibold py-2 rounded-lg min-h-[36px]" style={{ background: `${color}20`, color }}>
          Close
        </button>
      </div>
    </div>
  );
}

/** Relative time: "2h ago", "3d ago", "Jan 5" */
function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return new Date(dateStr).toLocaleDateString("en", { month: "short", day: "numeric" });
}
