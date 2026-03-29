import { useState } from "react";
import { format } from "date-fns";
import {
  MoreVertical,
  CheckCircle2,
  Clock,
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
import { cn } from "@/lib/utils";
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
  const isLong = caption.length > 180;
  const displayCaption = expanded ? caption : caption.slice(0, 180);
  const hasMedia = post.media_urls?.length > 0 || post.primary_media_url;
  const mainImage = post.primary_media_url || post.media_urls?.[0];

  const statusLine = () => {
    if (post.status === "published" && post.published_at) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-t-xl">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-xs font-medium text-green-500">
            Published {format(new Date(post.published_at), "MMM d 'at' h:mm a")}
          </span>
          {onDetails && (
            <button
              onClick={() => onDetails(post)}
              className="text-xs text-accent hover:underline ml-auto"
            >
              details
            </button>
          )}
        </div>
      );
    }
    if (post.status === "failed") {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 rounded-t-xl">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-xs font-medium text-destructive">
            Failed to publish
          </span>
          <button
            onClick={() => onAction("retry", post)}
            className="text-xs text-accent hover:underline ml-auto"
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

      <div className="p-4">
        {/* Category badge + overflow */}
        <div className="flex items-center justify-between mb-2">
          {post.category_id ? (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-accent/30 text-accent tracking-wide">
              {(post.metadata as any)?.category_name || "Category"}
            </span>
          ) : (
            <div />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded hover:bg-muted transition-colors">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
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

        {/* Caption */}
        {caption && (
          <div className="mb-3">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {displayCaption}
              {isLong && !expanded && "…"}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-muted-foreground hover:text-foreground mt-1"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* Media */}
        {mainImage && (
          <div className="rounded-lg overflow-hidden mb-3">
            <img
              src={mainImage}
              alt=""
              className="w-full max-h-[400px] object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Draft actions */}
        {post.status === "draft" && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            {onEdit && (
              <button
                onClick={() => onEdit(post)}
                className="p-1.5 rounded hover:bg-muted transition-colors"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => onAction("schedule", post)}
              >
                Schedule
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="px-1.5">
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

        {/* Published stats placeholder */}
        {post.status === "published" && post.targets && post.targets.length > 0 && (
          <div className="pt-2 border-t border-border space-y-1">
            {post.targets.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-xs text-muted-foreground">
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
    </div>
  );
}
