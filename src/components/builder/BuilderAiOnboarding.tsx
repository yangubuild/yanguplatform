/**
 * Builder AI Onboarding — Orchestrates the full "Build with AI" flow:
 * 1. Source picker (logo tiles)
 * 2. Source-specific import step (Google search, URL input, or manual questions)
 * 3. Progress screen
 * 4. Lands in manual editor
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { BuilderEngine } from "@/lib/builder/types";
import { validateDraft } from "@/lib/builder/aiPipeline";
import { AiImportSourcePicker, type ImportSource } from "./AiImportSourcePicker";
import { AiBuildingProgress } from "./AiBuildingProgress";
import { GoogleBusinessSearch, type GoogleBusinessResult } from "./importers/GoogleBusinessSearch";

interface CompletionNavigation {
  surfaceId: string;
  targetUrl: string;
  navigated: boolean;
}

interface Props {
  engine: BuilderEngine;
  onComplete: (answers: Record<string, unknown>) => Promise<unknown>;
  onBack: () => void;
}

export function BuilderAiOnboarding({ engine, onComplete, onBack }: Props) {
  const [phase, setPhase] = useState<"source" | "google_search" | "url_input" | "questions" | "generating">("source");
  const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
  const [profileUrl, setProfileUrl] = useState("");
  const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});
  const [isAiComplete, setIsAiComplete] = useState(false);
  const [pendingResult, setPendingResult] = useState<Record<string, unknown> | null>(null);
  const [editorUrl, setEditorUrl] = useState<string | null>(null);

  const handleSourceSelect = (source: ImportSource) => {
    setSelectedSource(source);
    if (source === "manual") {
      setPhase("questions");
    } else if (source === "google_business") {
      setPhase("google_search");
    } else {
      setPhase("url_input");
    }
  };

  const runAiGeneration = async (source: ImportSource, importPayload?: Record<string, unknown>) => {
    setPhase("generating");
    setIsAiComplete(false);
    setEditorUrl(null);

    try {
      const allowedTypes = engine.aiGenerationRules?.allowedSectionTypes || ["hero", "text", "contact"];
      const mergedAnswers = { ...aiAnswers, ...(importPayload || {}) };

      console.log("AI_DRAFT_GENERATION_START", {
        surfaceId: null,
        surfaceType: engine.surfaceType,
        _ai_source: source,
        _ai_answers: mergedAnswers,
        _ai_profile: importPayload || null,
        generationFunction: "builder-ai-generate-draft",
      });

      const { data, error } = await supabase.functions.invoke("builder-ai-generate-draft", {
        body: {
          engineKey: engine.key,
          answers: mergedAnswers,
          allowedSectionTypes: allowedTypes,
          source,
          source_url: profileUrl || importPayload?.website || undefined,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || "Generation failed");

      const validation = validateDraft(engine.key, (data.sections || []).map((s: any) => ({
        type: s.type,
        schema: s.schema || {},
      })));

      const nameKey = engine.key === "influencer" ? "display_name" :
                      engine.key === "community" ? "community_name" : "business_name";

      const businessName = data.business_name || mergedAnswers[nameKey] || mergedAnswers.business_name || "";

      console.log("AI_DRAFT_GENERATION_DONE", {
        surfaceId: null,
        surfaceType: engine.surfaceType,
        sectionCount: validation.cleanedSections.length,
        sectionTypes: validation.cleanedSections.map((section) => section.type),
        payload: data,
      });

      const result: Record<string, unknown> = {
        ...mergedAnswers,
        business_name: businessName,
        business_description: data.description || "",
        primary_color: data.primary_color || "#2563eb",
        slug: String(businessName)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 40),
        _ai_setup: true,
        _ai_source: source,
        _ai_sections: validation.cleanedSections,
        _ai_repairs: validation.repairs,
        _ai_answers: mergedAnswers,
        _ai_profile: {
          businessName,
          description: data.description || "",
          primaryColor: data.primary_color || "#2563eb",
          source,
        },
      };

      setPendingResult(result);
      setIsAiComplete(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
      setPhase(selectedSource === "manual" ? "questions" : "source");
    }
  };

  // Google Business callback — pass ALL extracted data including photos
  const handleGoogleSelect = (result: GoogleBusinessResult) => {
    const payload: Record<string, unknown> = {
      business_name: result.name,
      location: result.address,
      contact_phone: result.phone || "",
      website: result.website || "",
      industry: result.category || "",
      business_description: result.description || "",
      photos: result.photos || [],
      google_maps_url: result.googleMapsUrl || "",
    };
    runAiGeneration("google_business", payload);
  };

  // Social URL submit
  const handleUrlSubmit = () => {
    if (!profileUrl.trim()) {
      toast.error("Please enter a profile URL or handle");
      return;
    }
    runAiGeneration(selectedSource!, { profile_url: profileUrl });
  };

  // Manual AI questions submit
  const handleManualSubmit = () => {
    const filled = Object.entries(aiAnswers).filter(([, v]) => v.trim());
    if (filled.length === 0) {
      toast.error("Please answer at least one question");
      return;
    }
    runAiGeneration("manual");
  };

  const handleProgressDone = useCallback(async () => {
    if (!pendingResult) {
      console.error("AI_PROGRESS_DONE_NO_PENDING_RESULT");
      return;
    }

    console.log("AI_BUILD_START", {
      surfaceId: null,
      surfaceType: engine.surfaceType,
      _ai_source: pendingResult._ai_source ?? null,
      _ai_answers: pendingResult._ai_answers ?? null,
      _ai_profile: pendingResult._ai_profile ?? null,
    });

    try {
      const completion = await onComplete(pendingResult);
      if (completion && typeof completion === "object" && "targetUrl" in completion) {
        const route = completion as CompletionNavigation;
        setEditorUrl(route.targetUrl);
        if (!route.navigated) {
          console.error("AI_NAVIGATE_FAILED", {
            surfaceId: route.surfaceId,
            targetUrl: route.targetUrl,
            error: "navigate() returned non-navigated state",
          });
        }
      }
    } catch (error) {
      console.error("AI_NAVIGATE_FAILED", {
        surfaceId: null,
        targetUrl: editorUrl,
        error,
      });
    }
  }, [pendingResult, engine.surfaceType, onComplete, editorUrl]);

  // ─── Progress phase ───
  if (phase === "generating") {
    return (
      <AiBuildingProgress
        engineLabel={engine.label}
        isComplete={isAiComplete}
        onAnimationDone={handleProgressDone}
        editorUrl={editorUrl}
      />
    );
  }

  // ─── Google Business search phase ───
  if (phase === "google_search") {
    return (
      <GoogleBusinessSearch
        onSelect={handleGoogleSelect}
        onBack={() => setPhase("source")}
      />
    );
  }

  // ─── URL input phase (TikTok / Instagram / Facebook) ───
  if (phase === "url_input") {
    const sourceLabel = selectedSource === "instagram" ? "Instagram"
      : selectedSource === "tiktok" ? "TikTok"
      : selectedSource === "facebook" ? "Facebook" : "Profile";

    return (
      <div className="max-w-md mx-auto py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setPhase("source")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Import from {sourceLabel}</h2>
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
            autoFocus
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
      <div className="max-w-md mx-auto py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setPhase("source")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Quick AI Setup</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Answer a few questions and AI will generate your {engine.label} page.
          </p>
          {engine.key === "emenu" && (
            <p className="text-xs text-muted-foreground/70 mt-2 italic">
              Your menu will be created for QR use by default. You can enable ordering later in settings.
            </p>
          )}
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
          <Button onClick={handleManualSubmit} className="w-full gap-2">
            <Sparkles className="h-4 w-4" /> Generate with AI
          </Button>
        </div>
      </div>
    );
  }

  // ─── Source picker phase ───
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <AiImportSourcePicker
        onSelect={handleSourceSelect}
        categoryLabel={engine.label.toLowerCase()}
      />
    </div>
  );
}
