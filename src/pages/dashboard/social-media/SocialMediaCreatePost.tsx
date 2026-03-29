import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, PenLine, Sparkles, MessageSquare, Upload, Image, Type, Palette, LayoutGrid, Maximize2, Mountain, Smile, Hash, Mic, Globe, ChevronDown, Save, Send, Calendar as CalendarIcon, Loader2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocialPosts } from "@/hooks/social/useSocialPosts";
import { useConnectedAccounts } from "@/hooks/social/useConnectedAccounts";
import { useSocialWorkspace } from "@/hooks/social/useSocialWorkspace";
import { useSocialBrandProfile } from "@/hooks/social/useSocialBrandProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DescribePostModal } from "@/components/social-media/create/DescribePostModal";
import { AICreateFlow } from "@/components/social-media/create/AICreateFlow";
import { MediaSourcePicker } from "@/components/social-media/create/MediaSourcePicker";
import { PostDesignEditor } from "@/components/social-media/create/PostDesignEditor";
import type { SocialConnectedAccount } from "@/types/socialMedia";

type CreateMode = "menu" | "scratch" | "describe" | "ai" | "design";

export default function SocialMediaCreatePost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") as CreateMode || "menu";
  const [mode, setMode] = useState<CreateMode>(initialMode === "menu" || initialMode === "scratch" || initialMode === "describe" || initialMode === "ai" ? initialMode : "menu");

  const goBack = () => {
    if (mode === "menu") {
      navigate("/dashboard/social-media/posts");
    } else if (mode === "design") {
      setMode("scratch");
    } else {
      setMode("menu");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Back button */}
      <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        {mode === "menu" ? "Back to Posts" : mode === "design" ? "Back to Editor" : "Back"}
      </button>

      {mode === "menu" && <CreatePostMenu onSelect={setMode} />}
      {mode === "scratch" && <ScratchWorkspace onOpenDesign={() => setMode("design")} />}
      {mode === "describe" && <DescribePostModal open onClose={() => setMode("menu")} />}
      {mode === "ai" && <AICreateFlow onDone={() => navigate("/dashboard/social-media/posts")} onBack={() => setMode("menu")} />}
      {mode === "design" && <PostDesignEditor onClose={() => setMode("scratch")} />}
    </div>
  );
}

/* ─── Entry Menu ─── */
function CreatePostMenu({ onSelect }: { onSelect: (mode: CreateMode) => void }) {
  const entries = [
    {
      key: "scratch" as CreateMode,
      icon: PenLine,
      label: "From Scratch",
      desc: "Create a new post manually with full control",
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      key: "describe" as CreateMode,
      icon: MessageSquare,
      label: "Describe Your Post",
      desc: "Tell us what you want and we'll generate it",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      key: "ai" as CreateMode,
      icon: Sparkles,
      label: "AI Create",
      desc: "Generate posts from your topics and brand profile",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-foreground mb-2">Create Post</h1>
      <p className="text-sm text-muted-foreground mb-8">Choose how you'd like to create your post</p>
      <div className="space-y-3">
        {entries.map((e) => (
          <button
            key={e.key}
            onClick={() => onSelect(e.key)}
            className="w-full flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:border-accent/40 transition-all group text-left"
          >
            <div className={`w-12 h-12 rounded-xl ${e.bg} flex items-center justify-center shrink-0`}>
              <e.icon className={`h-6 w-6 ${e.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">{e.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{e.desc}</p>
            </div>
            <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── From Scratch Workspace ─── */
function ScratchWorkspace({ onOpenDesign }: { onOpenDesign: () => void }) {
  const navigate = useNavigate();
  const { createPost, schedulePost, publishPost, isCreating, isPublishing } = useSocialPosts();
  const { accounts } = useConnectedAccounts();
  const { workspace } = useSocialWorkspace();
  const { profile: brandProfile } = useSocialBrandProfile();
  const [caption, setCaption] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduledFor, setScheduledFor] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [publishTarget, setPublishTarget] = useState<"all" | "select">("all");

  const activeAccounts = accounts.filter((a) => a.status === "active");
  const isBusy = isCreating || isPublishing;

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleGenerateCaption = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const profileMeta = brandProfile?.metadata as Record<string, unknown> | null;
      const { data, error: fnError } = await supabase.functions.invoke("social-ai-caption", {
        body: {
          topic: caption || "general business post",
          style: "short",
          business_description: workspace?.business_description || (profileMeta?.business_description as string) || "",
          brand_profile: brandProfile ? {
            tone_of_voice: brandProfile.tone_of_voice,
            brand_voice: brandProfile.brand_voice,
            caption_rules: brandProfile.caption_rules,
            preferred_ctas: brandProfile.preferred_ctas,
            brand_keywords: brandProfile.brand_keywords,
            hashtag_rules: brandProfile.hashtag_rules,
            emoji_policy: brandProfile.emoji_policy,
            target_audience: brandProfile.target_audience,
            business_description: (profileMeta?.business_description as string) || workspace?.business_description || "",
          } : undefined,
        },
      });
      if (fnError) throw fnError;
      if (data?.caption) {
        setCaption(data.caption);
        toast.success("Caption generated!");
      }
    } catch {
      toast.error("Failed to generate caption");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!caption.trim()) { toast.error("Enter a caption first"); return; }
    setError("");
    try {
      await createPost({
        workspace_id: workspace?.id || "",
        caption,
        source_type: "manual",
        content_type: mediaUrls.length > 0 ? "image" : "text",
        target_account_ids: selectedAccounts,
        media_urls: mediaUrls,
      });
      toast.success("Draft saved!");
      navigate("/dashboard/social-media/posts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    }
  };

  const handleSchedule = async () => {
    if (!caption.trim()) { toast.error("Enter a caption first"); return; }
    if (!scheduledFor) { toast.error("Pick a date and time"); return; }
    setError("");
    try {
      const post = await createPost({
        workspace_id: workspace?.id || "",
        caption,
        source_type: "manual",
        content_type: mediaUrls.length > 0 ? "image" : "text",
        target_account_ids: selectedAccounts,
        media_urls: mediaUrls,
        scheduled_for: new Date(scheduledFor).toISOString(),
      });
      await schedulePost({ postId: post.id, scheduledFor: new Date(scheduledFor).toISOString() });
      toast.success("Post scheduled!");
      navigate("/dashboard/social-media/posts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule");
    }
  };

  const handlePublishNow = async () => {
    if (!caption.trim()) { toast.error("Enter a caption first"); return; }
    if (!selectedAccounts.length && activeAccounts.length > 0) {
      setError("Select at least one account to publish");
      return;
    }
    setError("");
    try {
      const post = await createPost({
        workspace_id: workspace?.id || "",
        caption,
        source_type: "manual",
        content_type: mediaUrls.length > 0 ? "image" : "text",
        target_account_ids: selectedAccounts,
        media_urls: mediaUrls,
      });
      await publishPost(post.id);
      toast.success("Post published!");
      navigate("/dashboard/social-media/posts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    }
  };

  const handleMediaSelected = (urls: string[]) => {
    setMediaUrls((prev) => [...prev, ...urls]);
    setShowMediaPicker(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
      {/* Left: Editor */}
      <div className="space-y-5">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Create Post</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-card border border-border">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Publish to</span>
              <button
                onClick={() => setPublishTarget(publishTarget === "all" ? "select" : "all")}
                className="text-xs font-medium text-accent flex items-center gap-0.5"
              >
                {publishTarget === "all" ? "all socials" : "selected"}
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Caption area */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Type your caption or describe your idea"
            className="w-full bg-transparent px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground min-h-[200px] resize-none focus:outline-none"
          />
          {/* Composer toolbar */}
          <div className="flex items-center gap-1 px-3 py-2 border-t border-border">
            <button
              onClick={handleGenerateCaption}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PenLine className="h-3.5 w-3.5" />}
              Write for Me
            </button>
            <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
              <Smile className="h-4 w-4" />
            </button>
            <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
              <Hash className="h-4 w-4" />
            </button>
            <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
              <Mic className="h-4 w-4" />
            </button>
            <span className="flex-1" />
            <span className="text-xs text-muted-foreground">{caption.length}</span>
          </div>
        </div>

        {/* Media area */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Media thumbnails */}
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setMediaUrls((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {/* Add media button */}
            <button
              onClick={() => setShowMediaPicker(true)}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-accent/40 flex items-center justify-center transition-colors group"
            >
              <Image className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={onOpenDesign} className="text-xs">
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
              New Design
            </Button>
          </div>
        </div>

        {/* Target accounts (expanded when "select") */}
        {publishTarget === "select" && (
          <div className="rounded-xl border border-border bg-card p-4">
            <label className="text-sm font-semibold text-foreground block mb-3">Select Accounts</label>
            {activeAccounts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No connected accounts. Connect accounts in Workspace.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activeAccounts.map((acc: SocialConnectedAccount) => (
                  <button
                    key={acc.id}
                    onClick={() => toggleAccount(acc.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      selectedAccounts.includes(acc.id)
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:border-accent/40"
                    }`}
                  >
                    {acc.avatar_url && <img src={acc.avatar_url} alt="" className="w-4 h-4 rounded-full" />}
                    {acc.provider_account_name || acc.provider}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedule */}
        <div className="rounded-xl border border-border bg-card p-4">
          <label className="text-sm font-semibold text-foreground block mb-2">Schedule (optional)</label>
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-3 pt-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isBusy}>
            {isCreating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save and Close
          </Button>
          {scheduledFor && (
            <Button variant="outline" onClick={handleSchedule} disabled={isBusy}>
              <CalendarIcon className="h-4 w-4 mr-1.5" />
              Schedule
            </Button>
          )}
          <Button variant="accent" onClick={handlePublishNow} disabled={isBusy} className="ml-auto">
            {isPublishing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
            Publish Now
          </Button>
        </div>
      </div>

      {/* Right: Preview panel */}
      <div className="hidden lg:block">
        <div className="sticky top-6 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-center mb-3">
            <Globe className="h-4 w-4 text-muted-foreground" />
          </div>
          {/* Mock preview */}
          <div className="rounded-lg bg-muted/30 p-4 min-h-[300px]">
            {mediaUrls.length > 0 ? (
              <img src={mediaUrls[0]} alt="Preview" className="w-full rounded-lg mb-3 object-cover max-h-[200px]" />
            ) : (
              <div className="w-full h-[120px] rounded-lg bg-muted/50 flex items-center justify-center mb-3">
                <Image className="h-8 w-8 text-muted-foreground/40" />
              </div>
            )}
            {/* Mock header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-muted/60" />
              <div className="space-y-1 flex-1">
                <div className="h-2.5 w-24 rounded bg-muted/60" />
                <div className="h-2 w-16 rounded bg-muted/40" />
              </div>
            </div>
            {caption ? (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6">{caption}</p>
            ) : (
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded bg-muted/40" />
                <div className="h-2 w-3/4 rounded bg-muted/40" />
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-3">*Preview may slightly differ from final post</p>
        </div>
      </div>

      {/* Media picker modal */}
      {showMediaPicker && (
        <MediaSourcePicker
          onSelect={handleMediaSelected}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </div>
  );
}
