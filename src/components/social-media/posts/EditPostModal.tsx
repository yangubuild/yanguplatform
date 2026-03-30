import { useState, useEffect, useRef } from "react";
import {
  X, Loader2, Save, Clock, ChevronDown, Smile, Hash, Mic,
  Undo2, Redo2, ImagePlus, Globe, Instagram, Music2,
  Upload, FolderOpen, Camera, Film, Sparkles, Linkedin,
} from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PostDesignEditor } from "@/components/social-media/create/PostDesignEditor";

interface Props {
  post: SocialPost;
  open: boolean;
  onClose: () => void;
}

const PLATFORM_ICONS = [
  { key: "web", icon: Globe, label: "Web" },
  { key: "instagram", icon: Instagram, label: "Instagram" },
  { key: "tiktok", icon: Music2, label: "TikTok" },
  { key: "google", icon: Globe, label: "Google" },
  { key: "linkedin", icon: Linkedin, label: "LinkedIn" },
];

const MEDIA_SOURCES = [
  { key: "upload", icon: Upload, label: "Upload" },
  { key: "library", icon: FolderOpen, label: "Library" },
  { key: "stock", icon: Camera, label: "Stock" },
  { key: "giphy", icon: Film, label: "Giphy" },
  { key: "generate", icon: Sparkles, label: "Generate" },
];

export function EditPostModal({ post, open, onClose }: Props) {
  const { updatePost, schedulePost } = useSocialPosts();
  const [caption, setCaption] = useState(post.caption || "");
  const [title, setTitle] = useState(post.title || "");
  const [scheduledFor, setScheduledFor] = useState(
    post.scheduled_for ? new Date(post.scheduled_for).toISOString().slice(0, 16) : ""
  );
  const [saving, setSaving] = useState(false);
  const [activePlatform, setActivePlatform] = useState("web");
  const [showDesignEditor, setShowDesignEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCaption(post.caption || "");
    setTitle(post.title || "");
    setScheduledFor(
      post.scheduled_for ? new Date(post.scheduled_for).toISOString().slice(0, 16) : ""
    );
  }, [post]);

  if (!open) return null;

  // Show design editor full-screen overlay
  if (showDesignEditor) {
    return <PostDesignEditor onClose={() => setShowDesignEditor(false)} />;
  }

  const mediaUrls: string[] = [
    ...(post.primary_media_url ? [post.primary_media_url] : []),
    ...(post.media_urls || []),
  ].filter((v, i, a) => a.indexOf(v) === i);
  const mainImage = mediaUrls[0];

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

  const handleMediaSource = (key: string) => {
    switch (key) {
      case "upload":
        fileInputRef.current?.click();
        break;
      case "library":
        toast.info("Library picker coming soon");
        break;
      case "stock":
        toast.info("Stock picker coming soon");
        break;
      case "giphy":
        toast.info("Giphy picker coming soon");
        break;
      case "generate":
        toast.info("AI image generation coming soon");
        break;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    toast.success(`${files.length} file(s) selected for upload`);
    // TODO: wire to actual upload logic
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-card sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-5xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border shrink-0">
          <h2 className="text-sm font-bold text-foreground">Edit Post</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row min-h-0">
          {/* Left: editor */}
          <div className="flex-1 p-4 sm:p-6 space-y-4 lg:border-r border-border min-w-0 overflow-y-auto">
            {/* Platform icons + publish target */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {PLATFORM_ICONS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setActivePlatform(p.key)}
                    className={`p-1.5 rounded-md transition-colors ${
                      activePlatform === p.key
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={p.label}
                  >
                    <p.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                Publish to <span className="text-accent font-medium">all socials</span>
              </span>
            </div>

            {/* Caption */}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your post caption…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm min-h-[140px] sm:min-h-[180px] focus:ring-1 focus:ring-accent resize-y"
            />

            {/* Caption tools */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Smile className="h-4 w-4" /></button>
                <button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Hash className="h-4 w-4" /></button>
                <button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Mic className="h-4 w-4" /></button>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Undo2 className="h-3.5 w-3.5" /></button>
                <button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Redo2 className="h-3.5 w-3.5" /></button>
                <span className="text-xs text-muted-foreground">{caption.length}</span>
              </div>
            </div>

            {/* Media thumbnails + add media popover */}
            <div className="flex gap-2 flex-wrap">
              {mediaUrls.map((url, i) => (
                <div
                  key={i}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-border"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {/* Add media — opens source popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors">
                    <ImagePlus className="h-5 w-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-44 p-1">
                  {MEDIA_SOURCES.map((src) => (
                    <button
                      key={src.key}
                      onClick={() => handleMediaSource(src.key)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-md hover:bg-muted transition-colors text-foreground"
                    >
                      <src.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {src.label}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Edit Design — opens PostDesignEditor */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setShowDesignEditor(true)}
              >
                Edit Design
              </Button>
            </div>

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

            {/* Link */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Link</label>
              <Input placeholder="Add a link" className="text-sm" />
            </div>
          </div>

          {/* Right: preview — hidden on mobile, shown on lg+ */}
          <div className="hidden lg:flex w-[340px] shrink-0 p-6 flex-col items-center overflow-y-auto">
            <div className="w-full max-w-[280px] rounded-xl border border-border bg-muted/20 overflow-hidden">
              {/* Platform icons in preview */}
              <div className="flex items-center justify-center gap-2 pt-3 pb-1">
                {PLATFORM_ICONS.map((p) => (
                  <div key={p.key} className="p-1 text-muted-foreground/40">
                    <p.icon className="h-3.5 w-3.5" />
                  </div>
                ))}
              </div>
              {/* Mock post header */}
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-2.5 w-16 bg-muted rounded" />
                  <div className="h-2 w-10 bg-muted/60 rounded" />
                </div>
                <div className="w-5 h-5 rounded-full bg-muted/40" />
              </div>

              {/* Caption preview */}
              <div className="px-3 pb-2">
                <p className="text-[11px] text-foreground leading-relaxed line-clamp-3">
                  {caption || "Your caption here…"}
                </p>
              </div>

              {/* Image preview */}
              {mainImage && (
                <img src={mainImage} alt="" className="w-full aspect-square object-cover" />
              )}

              {/* Mock reactions */}
              <div className="flex gap-2 p-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-5 h-5 rounded-full bg-muted/40" />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 text-center">
              *Preview may slightly differ from final post
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3 border-t border-border shrink-0">
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
  );
}
