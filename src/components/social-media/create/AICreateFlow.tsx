import { useState, useEffect, useRef } from "react";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSocialPosts } from "@/hooks/social/useSocialPosts";
import { useSocialWorkspace } from "@/hooks/social/useSocialWorkspace";
import { useSocialBrandProfile } from "@/hooks/social/useSocialBrandProfile";
import { getRandomTemplateForThemes, getThemeByKey } from "@/data/socialThemes";
import { getThemePreviewImage } from "@/data/themePreviewImages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AIState = "generating" | "ready" | "error";

const PHASES = [
  "Analyzing your brand profile…",
  "Selecting template…",
  "Generating captions…",
  "Editing template with your brand…",
  "Customizing design…",
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
  const { profile } = useSocialBrandProfile();
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

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /** Extract visual settings from brand profile */
  const getVisualContext = () => {
    const meta = (profile?.metadata as Record<string, unknown>) || {};
    const visualMeta = (meta.visual_metadata as Record<string, unknown>) || {};
    const selectedThemes = (visualMeta.selected_themes as string[]) || [];
    const brandColors = (visualMeta.brand_colors as string[]) || [];
    const useLogo = (visualMeta.use_logo as boolean) ?? false;
    return { selectedThemes, brandColors, useLogo };
  };

  /**
   * Convert a local imported asset path to a full URL that the edge function can access.
   * Vite imported assets are relative paths — we need to make them absolute.
   */
  const resolveTemplateUrl = (assetPath: string): string => {
    if (assetPath.startsWith("http")) return assetPath;
    // For Vite-bundled assets, construct full URL from current origin
    return `${window.location.origin}${assetPath}`;
  };

  const generateImageWithRetry = async (
    prompt: string,
    templateImageUrl: string | null,
    brandColors: string[],
    businessName: string,
    contentGoal: string,
    retries = 3,
  ): Promise<string | null> => {
    for (let attempt = 0; attempt < retries; attempt++) {
      if (attempt > 0) await delay(4000 * attempt);
      try {
        const body: Record<string, unknown> = {
          prompt,
          model: "google/gemini-3.1-flash-image-preview",
          aspect_ratio: "4:5",
          brand_colors: brandColors,
          business_name: businessName,
          content_goal: contentGoal,
        };

        if (templateImageUrl) {
          body.mode = "edit_template";
          body.template_image_url = templateImageUrl;
        }

        const { data: imgData, error: imgErr } = await supabase.functions.invoke("social-ai-generate-image", {
          body,
        });
        if (imgErr) {
          console.warn(`Image attempt ${attempt + 1} error:`, imgErr);
          continue;
        }
        const url = imgData?.image_url;
        if (url) return url;
      } catch (e) {
        console.warn(`Image attempt ${attempt + 1} exception:`, e);
      }
    }
    return null;
  };

  const runAIGeneration = async () => {
    try {
      const businessDesc = workspace?.business_description || "our business";
      const businessName = workspace?.name || "Our Brand";
      const { selectedThemes, brandColors, useLogo } = getVisualContext();
      let savedCount = 0;

      for (let i = 0; i < POST_TOPICS.length; i++) {
        const item = POST_TOPICS[i];
        if (i > 0) await delay(5000);

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

          // Stage B: Select template and edit it with brand context
          const template = getRandomTemplateForThemes(selectedThemes);
          const templateUrl = template ? resolveTemplateUrl(template.imageUrl) : null;
          const theme = template ? getThemeByKey(template.themeKey) : null;

          const editInstructions = buildTemplateEditPrompt(
            businessName, businessDesc, item.topic, item.goal,
            brandColors, useLogo, theme?.mood || ""
          );

          const imageUrl = await generateImageWithRetry(
            editInstructions, templateUrl, brandColors, businessName, item.goal
          );

          if (!imageUrl) {
            console.warn("Image generation failed after retries for topic:", item.topic);
          }

          // Stage C: Save draft
          await createPost({
            workspace_id: workspace?.id || "",
            caption,
            source_type: "ai_generated",
            content_type: imageUrl ? "image" : "text",
            media_urls: imageUrl ? [imageUrl] : [],
            target_account_ids: [],
            ai_generation_mode: "auto",
            ai_prompt: editInstructions,
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
          {generatedCount} post{generatedCount !== 1 ? "s" : ""} created from templates. Review and schedule them.
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

/** Build a template editing prompt (NOT from-scratch generation) */
function buildTemplateEditPrompt(
  businessName: string,
  businessDesc: string,
  topic: string,
  goal: string,
  brandColors: string[],
  useLogo: boolean,
  themeMood: string,
): string {
  const colorContext = brandColors.length > 0
    ? `Change the color scheme to use these brand colors: ${brandColors.join(", ")}.`
    : "Keep the existing color scheme but make it feel branded and cohesive.";
  const logoContext = useLogo
    ? `Add the business name "${businessName}" prominently as a brand element.`
    : "";

  return `Modify this social media post template for "${businessName}".

Business: ${businessDesc}
Topic: ${topic}
Goal: ${goal}
${themeMood ? `Theme mood: ${themeMood}` : ""}

EDITS TO MAKE:
- Replace all headline/title text with content about "${topic}" for "${businessName}"
- Replace any subtext/body text with a short compelling message related to the goal: ${goal}
${colorContext}
${logoContext}
- Keep any decorative elements, shapes, patterns, and visual structure intact
- Make all text professional and relevant to the business
- The final result should look like the same template design, just customized for this business`;
}
