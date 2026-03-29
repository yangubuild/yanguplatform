import { X, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import type { SocialPost } from "@/types/socialMedia";

interface Props {
  post: SocialPost;
  open: boolean;
  onClose: () => void;
  onDelete: (post: SocialPost) => void;
}

export function PostDetailsModal({ post, open, onClose, onDelete }: Props) {
  if (!open) return null;

  const mainImage = post.primary_media_url || post.media_urls?.[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Post Details</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex">
          {/* Left: info */}
          <div className="flex-1 p-6 space-y-4 border-r border-border min-w-0">
            {post.published_at && (
              <p className="text-sm text-foreground">
                Published on{" "}
                <span className="text-accent font-medium">
                  {format(new Date(post.published_at), "MMMM d")}
                </span>{" "}
                at{" "}
                <span className="text-accent font-medium">
                  {format(new Date(post.published_at), "h:mm a")}
                </span>
              </p>
            )}

            {/* Per-platform metrics */}
            {post.targets && post.targets.length > 0 ? (
              <div className="space-y-3">
                {post.targets.map((t) => {
                  const m = t.metrics_summary as Record<string, number> | null;
                  return (
                    <div key={t.id} className="flex items-center gap-3">
                      <span className="text-sm font-medium capitalize text-accent min-w-[100px]">
                        {t.provider}
                        <a href="#" className="ml-1 inline-flex">
                          <ExternalLink className="h-3 w-3 inline" />
                        </a>
                      </span>
                      {m ? (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>👍 {m.likes ?? 0}</span>
                          <span>💬 {m.comments ?? 0}</span>
                          <span>📊 {m.impressions ?? 0}</span>
                          <span>↗ {m.shares ?? 0}</span>
                          <span>👁 {m.views ?? 0}</span>
                          <span>🔗 {m.clicks ?? 0}</span>
                          <span>⭐ {m.engagement_rate ? `${m.engagement_rate}%` : "0.0%"}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Stats unavailable</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No platform data available</p>
            )}
          </div>

          {/* Right: preview */}
          <div className="w-[340px] shrink-0 p-6 flex flex-col items-center">
            <div className="w-full max-w-[280px] rounded-xl border border-border bg-muted/20 overflow-hidden">
              <div className="flex items-center gap-2 p-3">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-2.5 w-20 bg-muted rounded" />
                  <div className="h-2 w-12 bg-muted/60 rounded" />
                </div>
                <div className="w-6 h-6 rounded-full bg-muted/40" />
              </div>
              <div className="px-3 pb-2">
                <p className="text-[11px] text-foreground leading-relaxed line-clamp-4">
                  {post.caption || "No caption"}
                </p>
              </div>
              {mainImage && (
                <img src={mainImage} alt="" className="w-full aspect-square object-cover" />
              )}
              <div className="flex gap-3 p-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-muted/40" />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 text-center">
              *Preview may slightly differ from final post
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(post)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Post
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
