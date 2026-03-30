import { useState } from "react";
import { format } from "date-fns";
import {
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Copy,
  Download,
  Link2,
  Trash2,
  Send,
  CalendarClock,
  Crown,
  Pencil,
  Layers,
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
  const isLong = caption.length > 120;
  const displayCaption = expanded ? caption : caption.slice(0, 120);
  const mediaUrls: string[] = [
    ...(post.primary_media_url ? [post.primary_media_url] : []),
    ...(post.media_urls || []),
  ].filter((v, i, a) => a.indexOf(v) === i);
  const hasMedia = mediaUrls.length > 0;
  const mainImage = mediaUrls[0];
  const categoryName = (post.metadata as any)?.category_name || null;

  // Status bar for published / failed
  const statusLine = () => {
    if (post.status === "published" && post.published_at) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10">
          <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
          <span className="text-[10px] font-medium text-green-500 truncate">
            Published {format(new Date(post.published_at), "MMM d 'at' h:mm a")}
          </span>
          {onDetails && (
            <button onClick={() => onDetails(post)} className="text-[10px] text-accent hover:underline ml-auto shrink-0">
              details
            </button>
          )}
        </div>
      );
    }
    if (post.status === "failed") {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10">
          <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
          <span className="text-[10px] font-medium text-destructive">Failed</span>
          <button onClick={() => onAction("retry", post)} className="text-[10px] text-accent hover:underline ml-auto shrink-0">
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

      {/* Category + AB test icon + overflow menu */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        {/* Category dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border border-accent/30 text-accent tracking-wide hover:bg-accent/5 transition-colors">
              {categoryName || "Category"}
              <ChevronDown className="h-2.5 w-2.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {["DIGITAL COMMUNITY SERVICES", "DIGITAL COMMUNITY APP", "ESHOPS", "ESHOPS CONNECT", "REAL ESTATE", "DIGITAL MENU"].map((cat) => (
              <DropdownMenuItem key={cat} className="gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                {cat}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground" title="A/B test">
            <Layers className="h-3.5 w-3.5" />
          </button>
          {/* Overflow menu — matches reference exactly */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded hover:bg-muted transition-colors shrink-0">
                <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
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
      </div>

      {/* Caption — compact, before image */}
      {caption && (
        <div className="px-3 pb-1.5">
          <p className="text-[12px] text-foreground leading-snug whitespace-pre-wrap">
            {displayCaption}
            {isLong && !expanded && "…"}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] text-muted-foreground hover:text-foreground mt-0.5"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* Media — compact preview */}
      {mediaUrls.length > 1 ? (
        <MultiImagePreview urls={mediaUrls} />
      ) : mainImage ? (
        <div className="w-full overflow-hidden" style={{ aspectRatio: "4/5", maxHeight: "320px" }}>
          <img src={mainImage} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div
          className="w-full bg-gradient-to-br from-muted/40 via-muted/20 to-accent/10 flex flex-col items-center justify-center gap-2"
          style={{ aspectRatio: "4/5", maxHeight: "280px" }}
        >
          {post.source_type === "ai_generated" ? (
            <>
              <Loader2 className="h-5 w-5 text-accent animate-spin" />
              <p className="text-[11px] font-medium text-muted-foreground">Generating creative…</p>
            </>
          ) : (
            <div className="text-center px-4 max-w-[80%]">
              <p className="text-xs font-semibold text-foreground/60 leading-snug line-clamp-3">
                {caption.slice(0, 80) || "Post creative"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Draft actions — edit + schedule matching reference */}
      {post.status === "draft" && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border">
          {onEdit ? (
            <button
              onClick={() => onEdit(post)}
              className="p-1.5 rounded hover:bg-muted transition-colors"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-0.5">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 px-3"
              onClick={() => onAction("schedule", post)}
            >
              Schedule
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="px-1.5 h-7">
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
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
        <div className="px-3 py-1.5 border-t border-border space-y-0.5">
          {post.targets.map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-[10px] text-muted-foreground">
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

/** Compact multi-image preview */
function MultiImagePreview({ urls }: { urls: string[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  return (
    <div>
      <div className="w-full overflow-hidden" style={{ aspectRatio: "4/5", maxHeight: "320px" }}>
        <img src={urls[activeIdx]} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>
      {urls.length > 1 && (
        <div className="flex gap-1 px-3 py-1 overflow-x-auto">
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`w-8 h-8 rounded overflow-hidden shrink-0 border-2 transition-colors ${
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
