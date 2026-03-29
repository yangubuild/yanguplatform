import { useState, useRef } from "react";
import { X, Sparkles, Loader2, Calendar as CalendarIcon, Send, Save, AlertCircle } from "lucide-react";
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
  const [error, setError] = useState("");
  const aiLock = useRef(false);
  const actionLock = useRef(false);

  if (!open) return null;

  // Only show active accounts as valid targets
  const activeAccounts = accounts.filter(
    (a) => a.status === "active"
  );

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleGenerateCaption = async () => {
    if (aiLock.current || isGenerating) return;
    aiLock.current = true;
    setIsGenerating(true);
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("social-ai-caption", {
        body: {
          topic: caption || "general business post",
          style: "short",
          business_description: workspace?.business_description || "",
        },
      });
      if (fnError) throw fnError;
      if (data?.caption) {
        setCaption(data.caption);
        toast.success("Caption generated!");
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to generate caption");
      console.error(err);
    } finally {
      setIsGenerating(false);
      aiLock.current = false;
    }
  };

  const validateScheduleTime = (): boolean => {
    if (!scheduledFor) return true;
    const scheduled = new Date(scheduledFor);
    if (scheduled <= new Date()) {
      setError("Schedule time must be in the future");
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (actionLock.current) return;
    if (!caption.trim()) { toast.error("Enter a caption first"); return; }
    actionLock.current = true;
    setError("");
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
      setError(err instanceof Error ? err.message : "Failed to save draft");
      toast.error("Failed to save draft");
    } finally {
      actionLock.current = false;
    }
  };

  const handleSchedule = async () => {
    if (actionLock.current) return;
    if (!caption.trim()) { toast.error("Enter a caption first"); return; }
    if (!scheduledFor) { toast.error("Pick a date and time"); return; }
    if (!validateScheduleTime()) return;
    actionLock.current = true;
    setError("");
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
      setError(err instanceof Error ? err.message : "Failed to schedule post");
      toast.error("Failed to schedule post");
    } finally {
      actionLock.current = false;
    }
  };

  const handlePublishNow = async () => {
    if (actionLock.current) return;
    if (!caption.trim()) { toast.error("Enter a caption first"); return; }
    if (!selectedAccounts.length) {
      setError("Select at least one connected account to publish");
      toast.error("Select at least one account");
      return;
    }
    actionLock.current = true;
    setError("");
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
      const msg = err instanceof Error ? err.message : "Failed to publish post";
      if (msg.includes("No provider configured")) {
        setError("Publishing is not available — no provider connected. Connect an account first.");
      } else if (msg.includes("Invalid transition")) {
        setError("This post cannot be published in its current state. Try saving as draft first.");
      } else {
        setError(msg);
      }
      toast.error("Failed to publish post");
    } finally {
      actionLock.current = false;
    }
  };

  const resetAndClose = () => {
    setCaption("");
    setSelectedAccounts([]);
    setScheduledFor("");
    setError("");
    onClose();
  };

  const isBusy = isCreating || isPublishing || actionLock.current;

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

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

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
                {isGenerating ? "Generating…" : "Generate with AI"}
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
            {activeAccounts.length === 0 ? (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                No active accounts connected. Connect accounts in Workspace settings first.
              </p>
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
                    {acc.avatar_url && (
                      <img src={acc.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                    )}
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
              onChange={(e) => { setScheduledFor(e.target.value); setError(""); }}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button variant="outline" onClick={handleSaveDraft} disabled={isBusy}>
              {isCreating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Save Draft
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
      </div>
    </div>
  );
}
