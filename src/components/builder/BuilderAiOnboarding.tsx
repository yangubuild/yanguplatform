import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/primitives";
import { ArrowLeft, Loader2, Sparkles, Globe, Instagram, Facebook } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { BuilderEngine } from "@/lib/builder/types";

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

/**
 * AI-assisted onboarding: user picks a source (social profile URL or manual),
 * AI extracts/generates business info, then lands user in editor.
 */
export function BuilderAiOnboarding({ engine, onComplete, onBack }: Props) {
  const [phase, setPhase] = useState<"source" | "url_input" | "questions" | "generating">("source");
  const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
  const [profileUrl, setProfileUrl] = useState("");
  const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSourceSelect = (source: ImportSource) => {
    setSelectedSource(source);
    if (source === "manual") {
      setPhase("questions");
    } else {
      setPhase("url_input");
    }
  };

  const handleUrlSubmit = async () => {
    if (!profileUrl.trim()) {
      toast.error("Please enter a profile URL or handle");
      return;
    }
    setPhase("generating");
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("builder-ai-generate-business-profile", {
        body: {
          sellerKey: engine.key,
          prompt: `Import from ${selectedSource}: ${profileUrl}. Category: ${engine.label}`,
          source: selectedSource,
          source_url: profileUrl,
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || "Import failed");

      const result: Record<string, unknown> = {
        business_name: data.business_name || "",
        business_description: data.description || "",
        slug: (data.business_name || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 40),
        _ai_setup: true,
        _ai_source: selectedSource,
      };
      await onComplete(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
      setPhase("url_input");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualAiSubmit = async () => {
    const filledAnswers = Object.entries(aiAnswers).filter(([, v]) => v.trim());
    if (filledAnswers.length === 0) {
      toast.error("Please answer at least one question");
      return;
    }
    setPhase("generating");
    setIsGenerating(true);
    try {
      const prompt = engine.aiQuestions
        .map((q) => `${q.label}: ${aiAnswers[q.key] || "not provided"}`)
        .join("\n");

      const { data, error } = await supabase.functions.invoke("builder-ai-generate-business-profile", {
        body: { sellerKey: engine.key, prompt },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || "Generation failed");

      const nameKey = engine.aiQuestions.find((q) => q.key.includes("name"))?.key || "business_name";
      const result: Record<string, unknown> = {
        ...aiAnswers,
        business_name: data.business_name || aiAnswers[nameKey] || "",
        business_description: data.description || "",
        slug: (data.business_name || aiAnswers[nameKey] || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 40),
        _ai_setup: true,
        _ai_source: "manual",
      };
      await onComplete(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
      setPhase("questions");
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Generating phase ───
  if (phase === "generating") {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <h2 className="text-xl font-semibold text-foreground">Building your {engine.label}…</h2>
        <p className="text-sm text-muted-foreground">
          AI is setting up your page. You'll be able to edit everything in the editor.
        </p>
      </div>
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
          <Button onClick={handleUrlSubmit} disabled={!profileUrl.trim() || isGenerating} className="w-full gap-2">
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
          <Button
            onClick={handleManualAiSubmit}
            disabled={isGenerating}
            className="w-full gap-2"
          >
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
