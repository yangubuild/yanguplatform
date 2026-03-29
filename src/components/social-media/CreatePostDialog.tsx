import { useState } from "react";
import { X, Sparkles, Loader2, Calendar as CalendarIcon, Send, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConnectedAccounts } from "@/hooks/social/useConnectedAccounts";
import { useSocialPosts } from "@/hooks/social/useSocialPosts";
import { useSocialWorkspace } from "@/hooks/social/useSocialWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SocialConnectedAccount } from "@/types/socialMedia";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreatePostDialog({ open, onClose }: Props) {
  const { accounts } = useConnectedAccounts();
  const { createPost, schedulePost, publishPost, isCreating, isPublishing } = useSocialPosts();
  const { workspace } = useSocialWorkspace();
  const [caption, setCaption] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduledFor, setScheduledFor] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!open) return null;

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleGenerateCaption = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("social-ai-caption", {
        body: {
          topic: caption || "general business post",
          style: "short",
          business_description: workspace?.business_description || "",
        },
      });
      if (error) throw error;
      if (data?.caption) {
        setCaption(data.caption);
        toast.success("Caption generated!");
      }
    } catch (err) {
      toast.error("Failed to generate caption");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!caption.trim()) { toast.error("Enter a caption first"); return; }
    try {
      await createPost({
        workspace_id: workspace?.id || "",
        caption,
        source_type: "manual",
        content_type: "text",
        target_account_ids: selectedAccounts,
      });
      toast.success("Draft saved!");
      resetAndClose();
    } catch (err) {
      toast.error("Failed to save draft");
    }
  };

  const handleSchedule = async () => {
    if (!caption.trim()) { toast.error("Enter a caption first"); return; }
    if (!scheduledFor) { toast.error("Pick a date and time"); return; }
    try {
      const post = await createPost({
        workspace_id: workspace?.id || "",
        caption,
        source_type: "manual",
        content_type: "text",
        target_account_ids: selectedAccounts,
        scheduled_for: new Date(scheduledFor).toISOString(),
      });
      await schedulePost({ postId: post.id, scheduledFor: new Date(scheduledFor).toISOString() });
      toast.success("Post scheduled!");
      resetAndClose();
    } catch (err) {
      toast.error("Failed to schedule post");
    }
  };

  const handlePublishNow = async () => {
    if (!caption.trim()) { toast.error("Enter a caption first"); return; }
    if (!selectedAccounts.length) { toast.error("Select at least one account"); return; }
    try {
      const post = await createPost({
        workspace_id: workspace?.id || "",
        caption,
        source_type: "manual",
        content_type: "text",
        target_account_ids: selectedAccounts,
      });
      await publishPost(post.id);
      toast.success("Post published!");
      resetAndClose();
    } catch (err) {
      toast.error("Failed to publish post");
    }
  };

  const resetAndClose = () => {
    setCaption("");
    setSelectedAccounts([]);
    setScheduledFor("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground">Create Post</h2>
            <button onClick={resetAndClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Caption */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-foreground">Caption</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateCaption}
                disabled={isGenerating}
                className="text-accent text-xs"
              >
                {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                Generate with AI
              </Button>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your post caption…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm min-h-[120px] focus:ring-1 focus:ring-accent resize-none"
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">{caption.length} characters</div>
          </div>

          {/* Target accounts */}
          <div className="mb-4">
            <label className="text-sm font-semibold text-foreground block mb-2">Post to</label>
            {accounts.length === 0 ? (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                No accounts connected yet. Connect accounts in Workspace settings.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {accounts.map((acc: SocialConnectedAccount) => (
                  <button
                    key={acc.id}
                    onClick={() => toggleAccount(acc.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      selectedAccounts.includes(acc.id)
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:border-accent/40"
                    }`}
                  >
                    {acc.provider_account_name || acc.provider}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-foreground block mb-2">Schedule (optional)</label>
            <Input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button variant="outline" onClick={handleSaveDraft} disabled={isCreating}>
              <Save className="h-4 w-4 mr-1.5" />
              Save Draft
            </Button>
            {scheduledFor && (
              <Button variant="outline" onClick={handleSchedule} disabled={isCreating}>
                <CalendarIcon className="h-4 w-4 mr-1.5" />
                Schedule
              </Button>
            )}
            <Button variant="accent" onClick={handlePublishNow} disabled={isCreating || isPublishing} className="ml-auto">
              {isPublishing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
              Publish Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
