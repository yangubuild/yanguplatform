import { useState } from "react";
import { X, FileText, Link2, Image, Mic, ArrowUp, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocialPosts } from "@/hooks/social/useSocialPosts";
import { useSocialWorkspace } from "@/hooks/social/useSocialWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function DescribePostModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { createPost } = useSocialPosts();
  const { workspace } = useSocialWorkspace();
  const [prompt, setPrompt] = useState("");
  const [postCount, setPostCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCountMenu, setShowCountMenu] = useState(false);

  if (!open) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Describe what you want to post about"); return; }
    setIsGenerating(true);
    try {
      // Generate caption using AI
      const { data, error } = await supabase.functions.invoke("social-ai-caption", {
        body: {
          topic: prompt,
          style: "short",
          business_description: workspace?.business_description || "",
          count: postCount,
        },
      });
      if (error) throw error;

      // Create drafts from generated content
      const captions = data?.captions || (data?.caption ? [data.caption] : []);
      if (captions.length === 0 && data?.caption) {
        captions.push(data.caption);
      }

      for (const cap of captions.slice(0, postCount)) {
        await createPost({
          workspace_id: workspace?.id || "",
          caption: cap,
          source_type: "ai_generated",
          content_type: "text",
          target_account_ids: [],
        });
      }

      toast.success(`${Math.min(captions.length, postCount)} draft${captions.length > 1 ? "s" : ""} created!`);
      navigate("/dashboard/social-media/posts");
    } catch {
      toast.error("Failed to generate posts");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Create from Description</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Prompt input */}
        <div className="rounded-xl border border-border bg-background p-4 mb-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What do you want to post about?"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground min-h-[100px] resize-none focus:outline-none"
          />
          <div className="flex items-center gap-2 mt-2">
            <button className="p-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <FileText className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Link2 className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Image className="h-4 w-4" />
            </button>
            <span className="flex-1" />
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Mic className="h-4 w-4" />
            </button>
            <Button
              variant="accent"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="rounded-lg"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Options row */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
            Media <ChevronDown className="h-3 w-3" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowCountMenu(!showCountMenu)}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {postCount} posts <ChevronDown className="h-3 w-3" />
            </button>
            {showCountMenu && (
              <div className="absolute top-8 left-0 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[80px]">
                {[1, 2, 3, 5, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => { setPostCount(n); setShowCountMenu(false); }}
                    className={`block w-full px-3 py-1.5 text-xs text-left hover:bg-muted transition-colors ${
                      postCount === n ? "text-accent font-medium" : "text-foreground"
                    }`}
                  >
                    {n} post{n > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
            Context <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
