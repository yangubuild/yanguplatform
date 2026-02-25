import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/primitives";
import { ArrowLeft, Sparkles, Globe, Instagram, Facebook } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { BuilderEngine } from "@/lib/builder/types";
import { generateDraftFromAnswers, validateDraft } from "@/lib/builder/aiPipeline";
import { AiBuildProgress } from "./AiBuildProgress";

type ImportSource = "google_business" | "facebook" | "instagram" | "tiktok" | "manual";

const IMPORT_SOURCES: { key: ImportSource; label: string; icon: typeof Globe; description: string }[] = [
  { key: "google_business", label: "Google Business Profile", icon: Globe, description: "Import from your Google Business listing" },
  { key: "facebook", label: "Facebook Page", icon: Facebook, description: "Import from your Facebook page" },
  { key: "instagram", label: "Instagram Business", icon: Instagram, description: "Import from your Instagram profile" },
  { key: "tiktok", label: "TikTok Creator", icon: Globe, description: "Import from your TikTok profile" },
  { key: "manual", label: "Add info manually", icon: Sparkles, description: "AI will ask you a few questions and generate everything" },
];

interface Props {
  engine: BuilderEngine;
  onComplete: (answers: Record<string, unknown>) => Promise<void>;
  onBack: () => void;
}

export function BuilderAiOnboarding({ engine, onComplete, onBack }: Props) {
  const [phase, setPhase] = useState<"source" | "url_input" | "questions" | "generating">("source");
  const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
  const [profileUrl, setProfileUrl] = useState("");
  const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});
  const [isAiComplete, setIsAiComplete] = useState(false);
  const [pendingResult, setPendingResult] = useState<Record<string, unknown> | null>(null);

  const handleSourceSelect = (source: ImportSource) => {
    setSelectedSource(source);
    setPhase(source === "manual" ? "questions" : "url_input");
  };

  const runAiGeneration = async (prompt: string, source: ImportSource, sourceUrl?: string) => {
    setPhase("generating");
    setIsAiComplete(false);

    try {
      const allowedTypes = engine.aiGenerationRules?.allowedSectionTypes || ["hero", "text", "contact"];

      const { data, error } = await supabase.functions.invoke("builder-ai-generate-draft", {
        body: {
          engineKey: engine.key,
          answers: aiAnswers,
          allowedSectionTypes: allowedTypes,
          source,
          source_url: sourceUrl,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || "Generation failed");

      // Validate AI sections against boundaries
      const validation = validateDraft(engine.key, (data.sections || []).map((s: any) => ({
        type: s.type,
        schema: s.schema || {},
      })));

      const nameKey = engine.key === "influencer" ? "display_name" :
                      engine.key === "community" ? "community_name" : "business_name";

      const result: Record<string, unknown> = {
        ...aiAnswers,
        business_name: data.business_name || aiAnswers[nameKey] || "",
        business_description: data.description || "",
        primary_color: data.primary_color || "#2563eb",
        slug: (data.business_name || aiAnswers[nameKey] || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 40),
        _ai_setup: true,
        _ai_source: source,
        _ai_sections: validation.cleanedSections,
        _ai_repairs: validation.repairs,
      };

      setPendingResult(result);
      setIsAiComplete(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
      setPhase(source === "manual" ? "questions" : "url_input");
    }
  };

  const handleUrlSubmit = () => {
    if (!profileUrl.trim()) {
      toast.error("Please enter a profile URL or handle");
      return;
    }
    runAiGeneration(
      `Import from ${selectedSource}: ${profileUrl}. Category: ${engine.label}`,
      selectedSource!,
      profileUrl
    );
  };

  const handleManualAiSubmit = () => {
    const filledAnswers = Object.entries(aiAnswers).filter(([, v]) => v.trim());
    if (filledAnswers.length === 0) {
      toast.error("Please answer at least one question");
      return;
    }
    runAiGeneration(
      engine.aiQuestions.map((q) => `${q.label}: ${aiAnswers[q.key] || "not provided"}`).join("\n"),
      "manual"
    );
  };

  const handleProgressDone = async () => {
    if (pendingResult) {
      await onComplete(pendingResult);
    }
  };

  // ─── Generating phase (progress overlay) ───
  if (phase === "generating") {
    return (
      <AiBuildProgress
        engineLabel={engine.label}
        isComplete={isAiComplete}
        onAnimationDone={handleProgressDone}
      />
    );
  }

  // ─── URL input phase ───
  if (phase === "url_input") {
    return (
      <div className="max-w-md mx-auto py-12 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setPhase("source")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Import from {IMPORT_SOURCES.find((s) => s.key === selectedSource)?.label}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your profile URL or public handle. AI will extract your business info.
          </p>
        </div>
        <div className="space-y-3">
          <Label>Profile URL or Handle</Label>
          <Input
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
            placeholder={selectedSource === "instagram" ? "@yourhandle or https://instagram.com/…" : "https://…"}
          />
          <Button onClick={handleUrlSubmit} disabled={!profileUrl.trim()} className="w-full gap-2">
            <Sparkles className="h-4 w-4" /> Import & Generate
          </Button>
        </div>
      </div>
    );
  }

  // ─── Manual AI questions phase ───
  if (phase === "questions") {
    return (
      <div className="max-w-md mx-auto py-12 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setPhase("source")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Quick AI Setup</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Answer a few questions and AI will generate your {engine.label} page.
          </p>
        </div>
        <div className="space-y-3">
          {engine.aiQuestions.map((q) => (
            <div key={q.key} className="space-y-1.5">
              <Label className="text-sm">{q.label}{q.required ? " *" : ""}</Label>
              {q.type === "textarea" ? (
                <Textarea
                  value={aiAnswers[q.key] || ""}
                  onChange={(e) => setAiAnswers((p) => ({ ...p, [q.key]: e.target.value }))}
                  placeholder={q.placeholder}
                  rows={2}
                />
              ) : (
                <Input
                  value={aiAnswers[q.key] || ""}
                  onChange={(e) => setAiAnswers((p) => ({ ...p, [q.key]: e.target.value }))}
                  placeholder={q.placeholder}
                />
              )}
            </div>
          ))}
          <Button onClick={handleManualAiSubmit} className="w-full gap-2">
            <Sparkles className="h-4 w-4" /> Generate with AI
          </Button>
        </div>
      </div>
    );
  }

  // ─── Source picker phase ───
  return (
    <div className="max-w-2xl mx-auto py-12 space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <div>
        <h2 className="text-xl font-semibold text-foreground">How would you like to create?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Import from a social profile or let AI help you set up.
        </p>
      </div>
      <div className="grid gap-3">
        {IMPORT_SOURCES.map((source) => {
          const Icon = source.icon;
          return (
            <Card
              key={source.key}
              className="p-4 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => handleSourceSelect(source.key)}
            >
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm text-foreground">{source.label}</h3>
                <p className="text-xs text-muted-foreground">{source.description}</p>
              </div>
              <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
