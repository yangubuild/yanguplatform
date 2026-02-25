import { useState } from "react";
import { useBuilderSurfaceInit } from "@/hooks/useBuilderSurfaceInit";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Card, PrimaryButton } from "@/components/primitives";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Map menu item → surface_type */
const SURFACE_TYPE_MAP: Record<string, string> = {
  emenu: "emenu",
  esite: "quick_site",
  eshop: "eshop",
  estore: "store_listing",
};

const LABELS: Record<string, { title: string; description: string }> = {
  emenu: { title: "Emenu", description: "Create a digital menu for your restaurant or food business." },
  esite: { title: "Esite", description: "Build a quick website for your business." },
  eshop: { title: "Eshop", description: "Set up an online shop to sell your products." },
  estore: { title: "Estore", description: "Create a store listing page for your business." },
};

interface Props {
  sellerKey: string;
}

export default function SellerSurfacePage({ sellerKey }: Props) {
  const { user } = useAuth();
  const { initAndNavigate, isInitializing } = useBuilderSurfaceInit();
  const surfaceType = SURFACE_TYPE_MAP[sellerKey] || sellerKey;
  const meta = LABELS[sellerKey] || { title: sellerKey, description: "" };

  const [businessName, setBusinessName] = useState("");
  const [businessDesc, setBusinessDesc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // AI modal state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Describe what you sell or do");
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("builder-ai-generate-business-profile", {
        body: { sellerKey, prompt: aiPrompt },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) {
        const msg = data?.error === "rate_limited" ? "Rate limited — try again shortly"
          : data?.error === "payment_required" ? "AI credits exhausted"
          : data?.error === "quota_exceeded" ? "Daily AI quota reached — try again tomorrow"
          : data?.error === "unauthorized" ? "Please log in to use AI generation"
          : data?.error || "Generation failed";
        throw new Error(msg);
      }
      setBusinessName(data.business_name || "");
      setBusinessDesc(data.description || "");
      setAiOpen(false);
      setAiPrompt("");
      toast.success("Business profile generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!businessName.trim()) {
      toast.error("Please enter a business name");
      return;
    }
    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }

    setIsGenerating(true);
    try {
      const { data: genResult, error: genErr } = await supabase.functions.invoke(
        "builder-generate-schema",
        {
          body: {
            surface_type: surfaceType,
            title: businessName,
            description: businessDesc,
          },
        }
      );

      if (genErr) {
        const errMsg = genErr.message || "Edge function error";
        console.error("builder-generate-schema error:", genErr);
        toast.error(`builder-generate-schema failed: ${errMsg}`);
        throw new Error(errMsg);
      }
      if (!genResult?.ok) {
        const detail = genResult?.error || "Schema generation failed";
        console.error("builder-generate-schema non-ok:", genResult);
        toast.error(`Schema generation error: ${detail}`);
        throw new Error(detail);
      }

      const generatedSections: { type: string; schema: Record<string, unknown> }[] = [];
      const pages = genResult.schema?.pages || [];

      if (pages.length > 0 && pages[0].sections) {
        pages[0].sections.forEach((s: any) => {
          generatedSections.push({
            type: s.section_type || s.type || "hero",
            schema: s.schema || s.data || {},
          });
        });
      }

      const seedSections =
        generatedSections.length > 0
          ? generatedSections
          : [
              { type: "hero", schema: { headline: businessName, subheadline: businessDesc } },
              { type: "cta", schema: { label: "Contact Us", href: "" } },
            ];

      await initAndNavigate({
        surfaceType,
        slug: businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40),
        title: businessName,
        seedSections,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const busy = isGenerating || isInitializing;

  return (
    <div className="max-w-lg mx-auto py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{meta.title}</h1>
        <p className="text-muted-foreground mt-1">{meta.description}</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="biz-name">Business Name</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground hover:text-primary"
              onClick={() => setAiOpen(true)}
              disabled={busy}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Generate
            </Button>
          </div>
          <Input
            id="biz-name"
            placeholder="e.g. My Coffee Shop"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="biz-desc">Brief Description (optional)</Label>
          <Textarea
            id="biz-desc"
            placeholder="What does your business do?"
            value={businessDesc}
            onChange={(e) => setBusinessDesc(e.target.value)}
            disabled={busy}
            rows={3}
          />
        </div>
        <PrimaryButton onClick={handleCreate} disabled={busy} className="w-full">
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isGenerating ? "Generating your page…" : "Creating…"}
            </>
          ) : (
            `Create ${meta.title}`
          )}
        </PrimaryButton>
      </Card>

      {/* AI Business Profile Generator Modal */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Business Profile
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>What do you sell or do?</Label>
              <Textarea
                placeholder="e.g. I sell handmade jewelry inspired by African culture"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                disabled={aiLoading}
              />
            </div>
            <Button onClick={handleAIGenerate} disabled={aiLoading || !aiPrompt.trim()} className="w-full gap-2">
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Name & Description
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
