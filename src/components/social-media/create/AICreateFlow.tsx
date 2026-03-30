import { useState, useEffect, useRef } from "react";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSocialPosts } from "@/hooks/social/useSocialPosts";
import { useSocialWorkspace } from "@/hooks/social/useSocialWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AIState = "generating" | "ready" | "error";

const PHASES = [
  "Analyzing your brand profile…",
  "Generating captions…",
  "Creating post visuals…",
  "Designing your creatives…",
  "Polishing your posts…",
];

const POST_TOPICS = [
  { topic: "product promotion", style: "engaging", goal: "promotion" },
  { topic: "business update", style: "informative", goal: "awareness" },
  { topic: "customer engagement", style: "short", goal: "engagement" },
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

  useEffect(() => {
    if (state !== "generating") return;
    const interval = setInterval(() => {
      setProgress((p) => (p >= 95 ? p : Math.min(p + Math.random() * 6 + 1, 95)));
    }, 800);
    const phaseTimer = setInterval(() => {
      setPhaseIdx((i) => (i + 1) % PHASES.length);
    }, 3000);
    return () => { clearInterval(interval); clearInterval(phaseTimer); };
  }, [state]);

  const runAIGeneration = async () => {
    try {
      const businessDesc = workspace?.business_description || "our business";
      const businessName = workspace?.name || "Our Brand";
      let savedCount = 0;

      for (const item of POST_TOPICS) {
        try {
          // Stage A: Generate caption
          const { data: captionData, error: captionErr } = await supabase.functions.invoke("social-ai-caption", {
            body: {
              topic: item.topic,
              style: item.style,
              business_description: businessDesc,
            },
          });
          if (captionErr) throw captionErr;
          const caption = captionData?.caption || "";
          if (!caption) continue;

          // Stage B: Generate image creative
          const imagePrompt = buildImagePrompt(businessName, businessDesc, item.topic, item.goal);
          let imageUrl: string | undefined;

          try {
            const { data: imgData, error: imgErr } = await supabase.functions.invoke("social-ai-generate-image", {
              body: {
                prompt: imagePrompt,
                model: "google/gemini-3.1-flash-image-preview",
                aspect_ratio: "4:5",
              },
            });
            if (!imgErr && imgData?.image_url) {
              imageUrl = imgData.image_url;
            }
          } catch (imgError) {
            console.warn("Image generation failed for post, saving text-only:", imgError);
          }

          // Stage C: Save draft with caption + image
          await createPost({
            workspace_id: workspace?.id || "",
            caption,
            source_type: "ai_generated",
            content_type: imageUrl ? "image" : "text",
            media_urls: imageUrl ? [imageUrl] : [],
            target_account_ids: [],
            ai_generation_mode: "auto",
            ai_prompt: imagePrompt,
          });

          savedCount++;
        } catch (postErr) {
          console.error("Failed to generate post:", postErr);
        }
      }

      if (savedCount === 0) throw new Error("No posts generated");

      setGeneratedCount(savedCount);
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
          <h2 className="text-lg font-bold text-foreground mb-2">Creating your posts…</h2>
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
          {generatedCount} post{generatedCount !== 1 ? "s" : ""} created with images. Review and schedule them.
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

/** Build a context-aware image generation prompt */
function buildImagePrompt(
  businessName: string,
  businessDesc: string,
  topic: string,
  goal: string
): string {
  return `Create a professional social media post image for a business called "${businessName}".

Business: ${businessDesc}
Topic: ${topic}
Goal: ${goal}

Requirements:
- Clean, modern social media post design
- Professional typography with the business name or a short tagline
- Vibrant colors that match the business type
- Instagram/Facebook ready format (portrait 4:5)
- Include visual elements relevant to the business type
- Do NOT include any placeholder text like "lorem ipsum"
- Make it look like a real branded social media post, not stock photography
- Use bold, eye-catching design that would stop someone scrolling`;
}
