import { useState } from "react";
import { format } from "date-fns";
import {
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Eye,
  Copy,
  Download,
  Link2,
  Trash2,
  Send,
  CalendarClock,
  Crown,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { SocialPost } from "@/types/socialMedia";

interface Props {
  post: SocialPost;
  onAction: (action: string, post: SocialPost) => void;
  onEdit?: (post: SocialPost) => void;
  onDetails?: (post: SocialPost) => void;
}

export function PostCard({ post, onAction, onEdit, onDetails }: Props) {
  const [expanded, setExpanded] = useState(false);
  const caption = post.caption || "";
  const isLong = caption.length > 140;
  const displayCaption = expanded ? caption : caption.slice(0, 140);
  const mediaUrls: string[] = [
    ...(post.primary_media_url ? [post.primary_media_url] : []),
    ...(post.media_urls || []),
  ].filter((v, i, a) => a.indexOf(v) === i);
  const hasMedia = mediaUrls.length > 0;
  const mainImage = mediaUrls[0];

  // Status bar for published / failed
  const statusLine = () => {
    if (post.status === "published" && post.published_at) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
          <span className="text-[11px] font-medium text-green-500 truncate">
            Published {format(new Date(post.published_at), "MMM d 'at' h:mm a")}
          </span>
          {onDetails && (
            <button
              onClick={() => onDetails(post)}
              className="text-[11px] text-accent hover:underline ml-auto shrink-0"
            >
              details
            </button>
          )}
        </div>
      );
    }
    if (post.status === "failed") {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10">
          <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
          <span className="text-[11px] font-medium text-destructive">Failed</span>
          <button
            onClick={() => onAction("retry", post)}
            className="text-[11px] text-accent hover:underline ml-auto shrink-0"
          >
            Retry
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-accent/30 transition-colors">
      {statusLine()}

      {/* Category + overflow menu */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        {post.category_id ? (
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border border-accent/30 text-accent tracking-wide truncate max-w-[60%]">
            {(post.metadata as any)?.category_name || "Category"}
          </span>
        ) : (
          <div />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded hover:bg-muted transition-colors shrink-0">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onAction("ingredients", post)} className="gap-2 text-xs">
              <Eye className="h-3.5 w-3.5" /> Show ingredients
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("duplicate", post)} className="gap-2 text-xs">
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </DropdownMenuItem>
            {hasMedia && (
              <DropdownMenuItem onClick={() => onAction("download", post)} className="gap-2 text-xs">
                <Download className="h-3.5 w-3.5" /> Download Image
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onAction("share", post)} className="gap-2 text-xs">
              <Link2 className="h-3.5 w-3.5" /> Copy share link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onAction("delete", post)}
              className="gap-2 text-xs text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete post
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Caption — compact, before image like reference */}
      {caption && (
        <div className="px-3 pb-2">
          <p className="text-[13px] text-foreground leading-snug whitespace-pre-wrap">
            {displayCaption}
            {isLong && !expanded && "…"}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-muted-foreground hover:text-foreground mt-0.5"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* Media — preview container */}
      {mediaUrls.length > 1 ? (
        <MultiImagePreview urls={mediaUrls} />
      ) : mainImage ? (
        <div className="w-full overflow-hidden" style={{ aspectRatio: "4/5" }}>
          <img
            src={mainImage}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className="w-full bg-gradient-to-br from-muted/40 via-muted/20 to-accent/10 flex items-center justify-center"
          style={{ aspectRatio: "4/5" }}
        >
          <div className="text-center px-6 max-w-[80%]">
            <p className="text-sm font-semibold text-foreground/60 leading-snug line-clamp-4">
              {caption.slice(0, 100) || "Post creative"}
            </p>
          </div>
        </div>
      )}

      {/* Draft actions — edit + schedule */}
      {post.status === "draft" && (
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-border">
          {onEdit ? (
            <button
              onClick={() => onEdit(post)}
              className="p-1.5 rounded hover:bg-muted transition-colors"
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => onAction("schedule", post)}
            >
              Schedule
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="px-1.5 h-8">
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onAction("publish", post)} className="gap-2 text-xs">
                  <Send className="h-3.5 w-3.5" /> Publish Now
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction("schedule_next", post)} className="gap-2 text-xs">
                  <CalendarClock className="h-3.5 w-3.5" /> Schedule Next
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction("lock_time", post)} className="gap-2 text-xs">
                  <Crown className="h-3.5 w-3.5" /> Set Lock Time
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Published stats */}
      {post.status === "published" && post.targets && post.targets.length > 0 && (
        <div className="px-3 py-2 border-t border-border space-y-1">
          {post.targets.map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="font-medium capitalize">{t.provider}</span>
              {t.metrics_summary ? (
                <span>
                  👁 {(t.metrics_summary as any)?.views ?? 0}{" "}
                  👍 {(t.metrics_summary as any)?.likes ?? 0}{" "}
                  💬 {(t.metrics_summary as any)?.comments ?? 0}
                </span>
              ) : (
                <span className="italic">Stats not tracked</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Compact multi-image preview — shows main image + thumbnail strip */
function MultiImagePreview({ urls }: { urls: string[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  return (
    <div>
      <div className="w-full overflow-hidden" style={{ aspectRatio: "4/5" }}>
        <img
          src={urls[activeIdx]}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      {urls.length > 1 && (
        <div className="flex gap-1 px-3 py-1.5 overflow-x-auto">
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`w-10 h-10 rounded overflow-hidden shrink-0 border-2 transition-colors ${
                i === activeIdx ? "border-accent" : "border-transparent opacity-60"
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
