import { useState, useEffect } from "react";
import { X, Loader2, Save, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocialPosts } from "@/hooks/social/useSocialPosts";
import { toast } from "sonner";
import type { SocialPost } from "@/types/socialMedia";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  post: SocialPost;
  open: boolean;
  onClose: () => void;
}

export function EditPostModal({ post, open, onClose }: Props) {
  const { updatePost, schedulePost, publishPost } = useSocialPosts();
  const [caption, setCaption] = useState(post.caption || "");
  const [title, setTitle] = useState(post.title || "");
  const [scheduledFor, setScheduledFor] = useState(
    post.scheduled_for ? new Date(post.scheduled_for).toISOString().slice(0, 16) : ""
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCaption(post.caption || "");
    setTitle(post.title || "");
    setScheduledFor(
      post.scheduled_for ? new Date(post.scheduled_for).toISOString().slice(0, 16) : ""
    );
  }, [post]);

  if (!open) return null;

  const mainImage = post.primary_media_url || post.media_urls?.[0];

  const handleSaveAndClose = async () => {
    setSaving(true);
    try {
      await updatePost({ id: post.id, caption, title: title || undefined });
      toast.success("Post saved");
      onClose();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledFor) {
      toast.error("Pick a date and time");
      return;
    }
    setSaving(true);
    try {
      await updatePost({ id: post.id, caption, title: title || undefined });
      await schedulePost({ postId: post.id, scheduledFor: new Date(scheduledFor).toISOString() });
      toast.success("Post scheduled");
      onClose();
    } catch {
      toast.error("Failed to schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Edit Post</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex">
          {/* Left: editor */}
          <div className="flex-1 p-6 space-y-4 border-r border-border min-w-0">
            {/* Caption */}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your post caption…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm min-h-[180px] focus:ring-1 focus:ring-accent resize-y"
            />
            <div className="text-xs text-muted-foreground text-right">{caption.length}</div>

            {/* Media thumbnails */}
            {(post.media_urls?.length > 0 || mainImage) && (
              <div className="flex gap-2 flex-wrap">
                {(post.media_urls?.length ? post.media_urls : [mainImage]).filter(Boolean).map((url, i) => (
                  <div
                    key={i}
                    className="w-20 h-20 rounded-lg overflow-hidden border border-border"
                  >
                    <img src={url!} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="w-20 h-20 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors">
                  <span className="text-xl">+</span>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                className="text-sm"
              />
            </div>
          </div>

          {/* Right: preview */}
          <div className="w-[340px] shrink-0 p-6 flex flex-col items-center">
            <div className="w-full max-w-[280px] rounded-xl border border-border bg-muted/20 overflow-hidden">
              {/* Mock post header */}
              <div className="flex items-center gap-2 p-3">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-2.5 w-20 bg-muted rounded" />
                  <div className="h-2 w-12 bg-muted/60 rounded" />
                </div>
                <div className="w-6 h-6 rounded-full bg-muted/40" />
              </div>

              {/* Caption preview */}
              <div className="px-3 pb-2">
                <p className="text-[11px] text-foreground leading-relaxed line-clamp-4">
                  {caption || "Your caption here…"}
                </p>
              </div>

              {/* Image preview */}
              {mainImage && (
                <img src={mainImage} alt="" className="w-full aspect-square object-cover" />
              )}

              {/* Mock reactions */}
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
          <div />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveAndClose} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              Save and Close
            </Button>
            <div className="flex">
              <Button variant="accent" size="sm" onClick={handleSchedule} disabled={saving} className="rounded-r-none">
                <Clock className="h-3.5 w-3.5 mr-1" />
                Schedule
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="accent" size="sm" className="rounded-l-none border-l border-accent-foreground/20 px-1.5">
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-xs">
                    <Input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="text-xs h-7"
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
