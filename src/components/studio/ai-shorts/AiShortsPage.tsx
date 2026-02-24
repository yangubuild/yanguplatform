import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Info, Pen, Sparkles, Clock, AudioLines,
  Smartphone, Monitor, Square, RefreshCw, Coins,
  Loader2, Download, Play, Pause,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCredits } from "@/hooks/useCredits";
import { useScriptGenerate, useVideoGenerate } from "@/hooks/useStudioEngine";
import {
  checkSubscriptionGate,
  type VideoGenerateResult,
  type ScriptGenerateResult,
} from "@/lib/studio/StudioAIEngine";
import { supabase } from "@/integrations/supabase/client";

/* ─── Types ─── */
type AspectRatio = "9:16" | "16:9" | "1:1";
type ScriptStyle = "Storytelling" | "Promotional" | "Exploration" | "Motivational";

const STYLES: { name: string; video?: string }[] = [
  { name: "Collage", video: "/videos/ai-shorts/style-1.mp4" },
  { name: "Line art", video: "/videos/ai-shorts/style-2.mp4" },
  { name: "4K realistic", video: "/videos/ai-shorts/style-3.mp4" },
  { name: "Cinematic", video: "/videos/ai-shorts/style-4.mp4" },
  { name: "Cartoonish", video: "/videos/ai-shorts/style-5.mp4" },
  { name: "3D", video: "/videos/ai-shorts/style-6.mp4" },
  { name: "Kawaii", video: "/videos/ai-shorts/style-7.mp4" },
  { name: "Steam punk", video: "/videos/ai-shorts/style-8.mp4" },
  { name: "Pixel art", video: "/videos/ai-shorts/style-9.mp4" },
];

const ASPECT_OPTIONS: { value: AspectRatio; label: string; icon: typeof Smartphone }[] = [
  { value: "9:16", label: "9:16", icon: Smartphone },
  { value: "16:9", label: "16:9", icon: Monitor },
  { value: "1:1", label: "1:1", icon: Square },
];

const SCRIPT_STYLES: ScriptStyle[] = ["Storytelling", "Promotional", "Exploration", "Motivational"];

const EXAMPLE_SCRIPT =
  "Discover a new era of gaming with the QuantumX. Immerse yourself in breathtaking visuals, lightning-fast performance, and unrivaled realism. With cutting-edge technology at your fingertips, every game becomes an epic adventure.";

const ASPECT_MAP: Record<AspectRatio, string> = {
  "9:16": "9:16",
  "16:9": "16:9",
  "1:1": "1:1",
};

/* ─── Asset helper ─── */
async function saveShortAsset(
  result: VideoGenerateResult,
  meta: { script: string; style: string; aspectRatio: string },
) {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return;

  // Find or use a default project
  const { data: projects } = await supabase
    .from("studio_projects")
    .select("id")
    .eq("user_id", session.user.id)
    .limit(1);

  let projectId = projects?.[0]?.id;
  if (!projectId) {
    const { data: newProject } = await supabase
      .from("studio_projects")
      .insert({ user_id: session.user.id, title: "My Studio" })
      .select("id")
      .single();
    projectId = newProject?.id;
  }
  if (!projectId) return;

  await supabase.from("studio_assets").insert({
    user_id: session.user.id,
    project_id: projectId,
    asset_type: "ai_short",
    file_url: result.videoUrl || null,
    thumbnail_url: result.thumbnailUrl || null,
    generation_prompt: meta.script.slice(0, 500),
    metadata: {
      tool: "ai_shorts",
      style: meta.style,
      aspectRatio: meta.aspectRatio,
      scriptPreview: meta.script.slice(0, 120),
      generationId: result.generationId,
    },
  });
}

/* ─── Page ─── */
export default function AiShortsPage() {
  const navigate = useNavigate();
  const { data: credits, isLoading: creditsLoading } = useCredits();

  // Form state
  const [script, setScript] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");

  // Modals
  const [showScriptWriter, setShowScriptWriter] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // AI Script Writer state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiScriptStyle, setAiScriptStyle] = useState<ScriptStyle>("Storytelling");

  // Generation state
  const [generatedResult, setGeneratedResult] = useState<VideoGenerateResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScriptGenerating, setIsScriptGenerating] = useState(false);

  const scriptMutation = useScriptGenerate();
  const videoMutation = useVideoGenerate();

  /* ── Subscription gate check ── */
  const runGateCheck = useCallback(async (): Promise<boolean> => {
    const gate = await checkSubscriptionGate("ai-shorts");
    if (!gate.allowed) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  }, []);

  /* ── AI Script Writer → Generate script ── */
  const handleAiScriptGenerate = useCallback(async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt for the AI script writer.");
      return;
    }

    const allowed = await runGateCheck();
    if (!allowed) {
      setShowScriptWriter(false);
      return;
    }

    setIsScriptGenerating(true);
    try {
      const result = await scriptMutation.mutateAsync({
        tool: "ai-shorts",
        type: "script.generate",
        prompt: aiPrompt,
        style: aiScriptStyle,
      });

      if (result.script) {
        setScript(result.script.slice(0, 1000));
        toast.success("Script generated! You can edit it before generating the short.");
        setShowScriptWriter(false);
        setAiPrompt("");
      }
    } catch {
      // Error toast handled by hook
    } finally {
      setIsScriptGenerating(false);
    }
  }, [aiPrompt, aiScriptStyle, runGateCheck, scriptMutation]);

  /* ── Generate AI Short ── */
  const handleGenerate = useCallback(async () => {
    if (!script.trim()) {
      toast.error("Please write or generate a script first.");
      return;
    }

    const allowed = await runGateCheck();
    if (!allowed) return;

    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const result = await videoMutation.mutateAsync({
        tool: "ai-shorts",
        type: "video.generate",
        prompt: script,
        params: {
          aspect_ratio: ASPECT_MAP[aspectRatio],
          visual_style: STYLES[selectedStyle].name,
          script_text: script,
        },
      });

      setGeneratedResult(result);

      // Save asset in background
      saveShortAsset(result, {
        script,
        style: STYLES[selectedStyle].name,
        aspectRatio,
      }).catch(() => {});

      toast.success("AI Short generated!");
    } catch {
      // Error toast handled by hook
    } finally {
      setIsGenerating(false);
    }
  }, [script, aspectRatio, selectedStyle, runGateCheck, videoMutation]);

  /* ── Download handler ── */
  const handleDownload = useCallback(async () => {
    if (!generatedResult?.videoUrl) return;
    try {
      const res = await fetch(generatedResult.videoUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-short-${STYLES[selectedStyle].name.toLowerCase().replace(/\s/g, "-")}-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed. Please try again.");
    }
  }, [generatedResult, selectedStyle]);

  const handleTryExample = () => setScript(EXAMPLE_SCRIPT);

  const canGenerate = script.trim().length > 0 && !isGenerating;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/studio")}
            className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1
              className="text-lg font-black uppercase tracking-tight text-foreground"
              style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}
            >
              AI Shorts
            </h1>
            <p className="text-xs text-muted-foreground">Create viral shorts in minutes</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
            Feedback
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent hover:bg-accent/20 transition-colors"
            onClick={() => navigate("/billing")}
          >
            {creditsLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Coins className="h-3.5 w-3.5" />
                {credits?.balance ?? 0} credits
              </>
            )}
            <span className="border-l border-accent/30 pl-2">Upgrade</span>
          </button>
        </div>
      </div>

      {/* ── Main 2-col layout ── */}
      <div className="flex-1 min-h-0 flex">
        {/* LEFT — scrollable builder panel */}
        <div className="w-[480px] shrink-0 min-h-0 overflow-y-auto p-6 lg:p-8 space-y-6 border-r border-border/20">
          {/* ── Script Section ── */}
          <div className="rounded-xl border border-border/30 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2
                  className="text-base font-bold text-foreground"
                  style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}
                >
                  Script
                </h2>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleTryExample}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                >
                  <Pen className="h-3.5 w-3.5" />
                  Try a example
                </button>
                <span className="text-border/40">|</span>
                <button
                  onClick={() => setShowScriptWriter(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                >
                  <span className="font-bold text-accent">AI</span>
                  Script writer
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value.slice(0, 1000))}
                placeholder="Enter your script here... (e.g. Meet the Tesla Model X, where cutting-edge technology meets unparalleled performance.)"
                className="w-full min-h-[220px] rounded-lg border border-border/30 bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:border-accent/50 transition-colors"
              />
              <div className="flex items-center justify-between px-1 mt-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <AudioLines className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {script.length}<span className="text-muted-foreground/50">/1000</span>
                </span>
              </div>
            </div>
          </div>

          {/* ── Aspect Ratio ── */}
          <div className="space-y-3">
            <h2
              className="text-base font-bold text-foreground"
              style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}
            >
              Aspect ratio
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {ASPECT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAspectRatio(opt.value)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                    aspectRatio === opt.value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground"
                  }`}
                >
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Style Selector ── */}
          <div className="space-y-3">
            <h2
              className="text-base font-bold text-foreground"
              style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}
            >
              Style
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {STYLES.map((style, idx) => (
                <button
                  key={style.name}
                  onClick={() => setSelectedStyle(idx)}
                  className="group flex flex-col gap-1.5"
                >
                  <div
                    className={`relative aspect-square rounded-xl border-2 overflow-hidden transition-all ${
                      selectedStyle === idx
                        ? "border-accent shadow-[0_0_12px_hsl(var(--accent)/0.3)]"
                        : "border-border/20 hover:border-border/40"
                    } bg-muted/10`}
                  >
                    {style.video ? (
                      <video
                        src={style.video}
                        muted
                        loop
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-muted-foreground/40 text-center px-2">
                          {style.name}
                        </span>
                      </div>
                    )}
                    {selectedStyle === idx && (
                      <div className="absolute top-1.5 left-1.5 h-5 w-5 rounded-full bg-accent flex items-center justify-center">
                        <svg className="h-3 w-3 text-accent-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground text-center">{style.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Generate button ── */}
          <Button
            variant="accent"
            className="w-full py-3 text-sm font-semibold"
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generate
              </span>
            )}
          </Button>
        </div>

        {/* RIGHT — Preview panel (static) */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
                <div className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">Generating your AI Short…</p>
              <p className="text-xs text-muted-foreground/60">This may take a minute or two</p>
            </div>
          ) : generatedResult?.videoUrl ? (
            <div className="flex flex-col items-center gap-6 w-full max-w-lg">
              <div className="rounded-xl overflow-hidden border border-border/30 bg-card w-full">
                <video
                  src={generatedResult.videoUrl}
                  controls
                  autoPlay
                  className="w-full max-h-[70vh] object-contain bg-black"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="accent"
                  className="px-6 py-2.5 text-sm font-semibold"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="px-6 py-2.5 text-sm font-semibold border-border/30 text-foreground hover:bg-muted/20"
                  onClick={() => {
                    setGeneratedResult(null);
                    setScript("");
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Short
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center max-w-xs">
              <div className="w-16 h-16 rounded-2xl bg-muted/20 border border-border/20 flex items-center justify-center">
                <Play className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-foreground">Preview</p>
              <p className="text-xs text-muted-foreground">
                Write a script, choose a style, and hit Generate to create your AI Short.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── AI Script Writer Modal ── */}
      <Dialog open={showScriptWriter} onOpenChange={setShowScriptWriter}>
        <DialogContent className="sm:max-w-[640px] bg-card border-border/30 p-8">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}
              >
                Let AI generate script for you
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                The prompt you enter here will be used to generate your video's script following the selected style.
              </p>
            </div>
          </div>

          <div className="relative mt-4">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value.slice(0, 1200))}
              placeholder="Enter your prompt here... (e.g. Write a script about Tesla Model X)"
              className="w-full min-h-[200px] rounded-lg border border-border/30 bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:border-accent/50 transition-colors"
            />
            <div className="flex items-center justify-between px-1 mt-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {aiPrompt.length}<span className="text-muted-foreground/50">/1200</span>
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <h3
              className="text-sm font-bold text-foreground"
              style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}
            >
              Script style
            </h3>
            <div className="flex gap-2 flex-wrap">
              {SCRIPT_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => setAiScriptStyle(style)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    aiScriptStyle === style
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <Button
              variant="accent"
              className="px-12 py-3 text-sm font-semibold"
              onClick={handleAiScriptGenerate}
              disabled={isScriptGenerating || !aiPrompt.trim()}
            >
              {isScriptGenerating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </span>
              ) : (
                "Generate"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Unlock AI Shorts (Upgrade) Modal ── */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-[520px] bg-card border-border/30 p-8">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
              <Sparkles className="h-7 w-7 text-accent" />
            </div>
            <h2
              className="text-xl font-bold text-foreground text-center"
              style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}
            >
              Unlock AI Shorts
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              Subscribe and turn scripts into artistic, animated video ads in minutes. Upgrade your plan to access AI-powered short video generation.
            </p>
            <Button
              variant="accent"
              className="w-full py-3 text-sm font-semibold"
              onClick={() => {
                setShowUpgradeModal(false);
                navigate("/billing");
              }}
            >
              Upgrade
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
