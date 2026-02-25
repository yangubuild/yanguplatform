import { useState } from "react";
import { useBuilderSurfaceInit } from "@/hooks/useBuilderSurfaceInit";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, PrimaryButton } from "@/components/primitives";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
  /** Which seller flow: "emenu" | "esite" | "eshop" | "estore" */
  sellerKey: string;
}

export default function SellerSurfacePage({ sellerKey }: Props) {
  const { user } = useAuth();
  const { initAndNavigate, isInitializing } = useBuilderSurfaceInit();
  const surfaceType = SURFACE_TYPE_MAP[sellerKey] || sellerKey;
  const meta = LABELS[sellerKey] || { title: sellerKey, description: "" };

  // Simple questionnaire state
  const [businessName, setBusinessName] = useState("");
  const [businessDesc, setBusinessDesc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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
      // 1) Call builder-generate-schema to get AI-generated schema
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

      if (genErr) throw new Error(genErr.message);
      if (!genResult?.ok) throw new Error(genResult?.error || "Schema generation failed");

      // 2) Convert generated schema sections into seed data
      const generatedSections: { type: string; schema: Record<string, unknown> }[] = [];
      const pages = genResult.schema?.pages || [];

      if (pages.length > 0 && pages[0].sections) {
        pages[0].sections.forEach((s: any, idx: number) => {
          generatedSections.push({
            type: s.section_type || s.type || "hero",
            schema: s.schema || s.data || {},
          });
        });
      }

      // Fallback: if no sections generated, seed defaults
      const seedSections =
        generatedSections.length > 0
          ? generatedSections
          : [
              { type: "hero", schema: { headline: businessName, subheadline: businessDesc } },
              { type: "cta", schema: { label: "Contact Us", href: "" } },
            ];

      // 3) Create surface + seed + navigate
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
          <Label htmlFor="biz-name">Business Name</Label>
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
    </div>
  );
}
