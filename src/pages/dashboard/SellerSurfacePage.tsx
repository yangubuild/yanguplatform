import { useState } from "react";
import { useBuilderSurfaceInit } from "@/hooks/useBuilderSurfaceInit";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Utensils, Wrench } from "lucide-react";
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
import { EmenuWizard, type WizardData } from "@/components/builder/EmenuWizard";

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

  // Emenu wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const isEmenu = sellerKey === "emenu";

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

  /** Handle emenu wizard completion — builds seed sections from wizard data */
  const handleWizardComplete = async (wd: WizardData) => {
    if (!user?.id) { toast.error("You must be logged in"); return; }

    // Build social links object
    const socialLinks: Record<string, string> = {};
    if (wd.social_website) socialLinks.website = wd.social_website;
    if (wd.social_instagram) socialLinks.instagram = wd.social_instagram;
    if (wd.social_facebook) socialLinks.facebook = wd.social_facebook;
    if (wd.social_twitter) socialLinks.twitter = wd.social_twitter;
    if (wd.social_tiktok) socialLinks.tiktok = wd.social_tiktok;

    // Build payment methods list
    const paymentMethods: Record<string, unknown>[] = [];
    if (wd.pay_cash) paymentMethods.push({ method: "cash", label: "Cash" });
    if (wd.pay_mobile_money) paymentMethods.push({
      method: "mobile_money", label: "Mobile Money",
      number: wd.mobile_money_number, name: wd.mobile_money_name,
    });
    if (wd.pay_card) paymentMethods.push({ method: "card", label: "Card / Stripe" });
    if (wd.pay_paypal) paymentMethods.push({ method: "paypal", label: "PayPal" });

    // Build order types
    const orderTypes: string[] = [];
    if (wd.order_dine_in) orderTypes.push("dine_in");
    if (wd.order_takeaway) orderTypes.push("takeaway");
    if (wd.order_delivery) orderTypes.push("delivery");

    // Build seed sections from wizard data
    const seedSections: { type: string; schema: Record<string, unknown> }[] = [
      {
        type: "hero",
        schema: {
          headline: wd.business_name,
          subheadline: `${wd.location || "Welcome to our restaurant"}`,
          media: wd.hero_banner_url ? {
            type: "image", source: "upload", url: wd.hero_banner_url, alt: `${wd.business_name} banner`, fit: "cover",
          } : { type: "none", source: "url", url: "", alt: "", fit: "contain" },
        },
      },
      {
        type: "menu",
        schema: {
          heading: "Menu",
          categories: [],
          layout_style: wd.layout_style,
          currency: wd.currency,
          currency_symbol: wd.currency_symbol,
        },
      },
      {
        type: "hours",
        schema: {
          heading: "Opening Hours",
          items: [],
        },
      },
      {
        type: "contact",
        schema: {
          heading: "Contact",
          email: wd.contact_email,
          phone: wd.contact_phone,
          address: wd.location,
        },
      },
    ];

    // Add social section if any links provided
    if (Object.keys(socialLinks).length > 0) {
      seedSections.push({
        type: "social",
        schema: { handles: socialLinks },
      });
    }

    // Store extra metadata on the surface for order/payment settings
    const surfaceMetadata = {
      brand: {
        logo: wd.logo_url,
        primary_color: wd.primary_color,
      },
      header: {
        logo_position: wd.logo_position,
        logo_size: wd.logo_size,
        show_name: wd.show_business_name,
      },
      order_types: orderTypes,
      payment_methods: paymentMethods,
    };

    try {
      await initAndNavigate({
        surfaceType: "emenu",
        slug: wd.slug,
        title: wd.business_name,
        seedSections,
        metadata: surfaceMetadata,
      });
      setWizardOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create menu");
    }
  };

  const busy = isGenerating || isInitializing;

  return (
    <div className="max-w-lg mx-auto py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{meta.title}</h1>
        <p className="text-muted-foreground mt-1">{meta.description}</p>
      </div>

      {/* Emenu: show two entry paths */}
      {isEmenu && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-6 space-y-3 border-2 border-primary/30 hover:border-primary/60 transition-colors cursor-pointer" onClick={() => setWizardOpen(true)}>
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Generate with Questions</h3>
            </div>
            <p className="text-sm text-muted-foreground">Answer a few questions and we'll auto-generate your menu page with branding, categories, and settings.</p>
            <Button size="sm" className="w-full gap-2" onClick={(e) => { e.stopPropagation(); setWizardOpen(true); }}>
              <Sparkles className="h-4 w-4" /> Start Wizard
            </Button>
          </Card>

          <Card className="p-6 space-y-3 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Build Manually</h3>
            </div>
            <p className="text-sm text-muted-foreground">Start with a blank menu and add sections, categories, and items yourself in the editor.</p>
          </Card>
        </div>
      )}

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

      {/* Emenu Wizard */}
      {isEmenu && (
        <EmenuWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          onComplete={handleWizardComplete}
        />
      )}
    </div>
  );
}
