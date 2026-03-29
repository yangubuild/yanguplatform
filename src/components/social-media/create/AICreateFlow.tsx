import { useState, useEffect, useRef } from "react";
import { Sparkles, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSocialPosts } from "@/hooks/social/useSocialPosts";
import { useSocialWorkspace } from "@/hooks/social/useSocialWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AIState = "generating" | "ready" | "error";

const PHASES = [
  "Analyzing your brand profile…",
  "Creating from your topics…",
  "Drafting opening lines…",
  "Coming up with ideas…",
  "Polishing your posts…",
];

interface Props {
  onDone: () => void;
  onBack: () => void;
}

export function AICreateFlow({ onDone, onBack }: Props) {
  const { createPost } = useSocialPosts();
  const { workspace } = useSocialWorkspace();
  const [state, setState] = useState<AIState>("generating");
  const [progress, setProgress] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    runAIGeneration();
  }, []);

  // Progress animation
  useEffect(() => {
    if (state !== "generating") return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return p;
        const inc = Math.random() * 8 + 2;
        return Math.min(p + inc, 95);
      });
    }, 600);
    const phaseTimer = setInterval(() => {
      setPhaseIdx((i) => (i + 1) % PHASES.length);
    }, 2500);
    return () => { clearInterval(interval); clearInterval(phaseTimer); };
  }, [state]);

  const runAIGeneration = async () => {
    try {
      // Generate 3 posts from topics/brand
      const results: string[] = [];
      for (let i = 0; i < 3; i++) {
        const { data, error } = await supabase.functions.invoke("social-ai-caption", {
          body: {
            topic: `business update #${i + 1}`,
            style: i === 0 ? "short" : i === 1 ? "engaging" : "informative",
            business_description: workspace?.business_description || "",
          },
        });
        if (error) throw error;
        if (data?.caption) results.push(data.caption);
      }

      // Save as drafts
      for (const caption of results) {
        await createPost({
          workspace_id: workspace?.id || "",
          caption,
          source_type: "ai_generated",
          content_type: "text",
          target_account_ids: [],
        });
      }

      setGeneratedCount(results.length);
      setProgress(100);
      setState("ready");
    } catch (err) {
      console.error("AI generation error:", err);
      setState("error");
      toast.error("Failed to generate posts");
    }
  };

  if (state === "generating") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
            <Sparkles className="h-7 w-7 text-accent" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Creating from your topics…</h2>
          <p className="text-sm text-muted-foreground mb-6">{PHASES[phaseIdx]}</p>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-sm font-medium text-muted-foreground w-10 text-right">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="rounded-2xl border border-border bg-card p-8">
          <h2 className="text-lg font-bold text-foreground mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-6">We couldn't generate your posts. Please try again.</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={onBack}>Go Back</Button>
            <Button variant="accent" onClick={() => { setState("generating"); setProgress(0); ran.current = false; }}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="h-7 w-7 text-green-500" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Your posts are ready!</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {generatedCount} post{generatedCount !== 1 ? "s" : ""} created. Check them out and save the ones you like.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={onBack}>Dismiss</Button>
          <Button variant="accent" onClick={onDone}>
            Review posts
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
