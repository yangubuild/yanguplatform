import { useCallback } from "react";
import { useBuilderSurfaceInit } from "@/hooks/useBuilderSurfaceInit";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getEngine } from "@/lib/builder/engineRegistry";
import { BuilderEntryScreen } from "@/components/builder/BuilderEntryScreen";
import { EmenuWizard, type WizardData } from "@/components/builder/EmenuWizard";
import { useState } from "react";
import { mergeIntoDefault } from "@/lib/builderDefaults";

/** Map legacy seller keys → engine keys */
const SELLER_KEY_MAP: Record<string, string> = {
  emenu: "emenu",
  esite: "esite",
  eshop: "eshop",
  estore: "estore",
};

interface Props {
  sellerKey: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

const toAiSeedSections = (value: unknown): { type: string; schema: Record<string, unknown> }[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const type = typeof entry.type === "string" ? entry.type : null;
      if (!type) return null;
      const rawSchema = isRecord(entry.schema) ? entry.schema : {};
      return { type, schema: mergeIntoDefault(type, rawSchema) };
    })
    .filter((entry): entry is { type: string; schema: Record<string, unknown> } => !!entry);
};

/**
 * Unified seller entry page.
 * For emenu, the "Build Manually" path still opens the existing EmenuWizard (identical questions).
 * For other categories, it uses the generic BuilderManualWizard via BuilderEntryScreen.
 */
export default function SellerSurfacePage({ sellerKey }: Props) {
  const { user } = useAuth();
  const { initAndNavigate } = useBuilderSurfaceInit();
  const engineKey = SELLER_KEY_MAP[sellerKey] || sellerKey;
  const engine = getEngine(engineKey);

  // Emenu wizard state (for backward-compat manual flow)
  const [emenuWizardOpen, setEmenuWizardOpen] = useState(false);

  /** Handle wizard/AI completion — build seed sections and navigate to editor */
  const handleComplete = useCallback(async (answers: Record<string, unknown>) => {
    if (!engine || !user?.id) { toast.error("You must be logged in"); return null; }

    const businessName = String(answers.business_name || answers.display_name || answers.community_name || "Untitled");
    const slug = String(answers.slug || businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40));

    const aiSeedSections = toAiSeedSections(answers._ai_sections);
    const seedSections = aiSeedSections.length > 0
      ? aiSeedSections
      : engine.defaultSections.map((s) => {
          const schema = mergeIntoDefault(s.type, s.schema);
          if (s.type === "hero") {
            if (!schema.headline) schema.headline = businessName;
            if (!schema.subheadline && answers.business_description) schema.subheadline = String(answers.business_description);
          }
          return { type: s.type, schema, core_slot: s.core_slot };
        });

    const aiSource = typeof answers._ai_source === "string" ? answers._ai_source : null;
    const aiAnswers = isRecord(answers._ai_answers) ? answers._ai_answers : {};
    const aiProfile = isRecord(answers._ai_profile) ? answers._ai_profile : {};

    console.log("AI_BUILD_START", {
      surfaceId: null,
      surfaceType: engine.surfaceType,
      _ai_source: aiSource,
      _ai_answers: aiAnswers,
      _ai_profile: aiProfile,
      sectionCount: seedSections.length,
      sectionTypes: seedSections.map((section) => section.type),
    });

    const metadata: Record<string, unknown> = {};
    if (answers.primary_color) metadata.brand = { primary_color: answers.primary_color };
    if (answers._ai_setup) {
      metadata.ai_setup = true;
      metadata.ai_source = aiSource;
      metadata.ai_answers = aiAnswers;
      metadata.ai_profile = aiProfile;
      metadata.ai_repairs = Array.isArray(answers._ai_repairs) ? answers._ai_repairs : [];
      metadata.generated_draft = {
        created_at: new Date().toISOString(),
        title: businessName,
        slug,
        sections: seedSections,
      };
    }

    return initAndNavigate({
      surfaceType: engine.surfaceType,
      slug,
      title: businessName,
      seedSections,
      metadata,
    });
  }, [user, engine, initAndNavigate]);

  /** Handle emenu wizard completion (existing flow, identical questions) */
  const handleEmenuWizardComplete = useCallback(async (wd: WizardData) => {
    if (!user?.id) { toast.error("You must be logged in"); return; }

    const socialLinks: Record<string, string> = {};
    if (wd.social_website) socialLinks.website = wd.social_website;
    if (wd.social_instagram) socialLinks.instagram = wd.social_instagram;
    if (wd.social_facebook) socialLinks.facebook = wd.social_facebook;
    if (wd.social_twitter) socialLinks.twitter = wd.social_twitter;
    if (wd.social_tiktok) socialLinks.tiktok = wd.social_tiktok;

    const paymentMethods: Record<string, unknown>[] = [];
    if (wd.pay_cash) paymentMethods.push({ method: "cash", label: "Cash" });
    if (wd.pay_mobile_money) paymentMethods.push({
      method: "mobile_money", label: "Mobile Money",
      number: wd.mobile_money_number, name: wd.mobile_money_name,
    });
    if (wd.pay_card) paymentMethods.push({ method: "card", label: "Card / Stripe" });
    if (wd.pay_paypal) paymentMethods.push({ method: "paypal", label: "PayPal" });

    const orderTypes: string[] = [];
    if (wd.order_dine_in) orderTypes.push("dine_in");
    if (wd.order_takeaway) orderTypes.push("takeaway");
    if (wd.order_delivery) orderTypes.push("delivery");

    const seedSections: { type: string; schema: Record<string, unknown>; core_slot?: string }[] = [
      {
        type: "header",
        schema: { logo_url: wd.logo_url || "", logo_position: wd.logo_position || "left", logo_size: wd.logo_size || "medium", show_name: wd.show_business_name !== false, name_next_to_logo: true },
        core_slot: "header",
      },
      {
        type: "hero",
        schema: {
          headline: wd.business_name, subheadline: "",
          media: wd.hero_banner_url ? {
            type: "image", source: "upload", url: wd.hero_banner_url, alt: `${wd.business_name} banner`, fit: "cover",
          } : { type: "none", source: "url", url: "", alt: "", fit: "contain" },
          logo: wd.logo_url || "", logo_position: wd.logo_position || "left",
        },
        core_slot: "hero",
      },
      { type: "menu", schema: { heading: "Menu", categories: [], layout_style: wd.layout_style, currency: wd.currency, currency_symbol: wd.currency_symbol }, core_slot: "main_content" },
      { type: "offer", schema: { heading: "Offers", description: "", items: [] }, core_slot: "offer" },
      { type: "footer", schema: { heading: "Footer", email: wd.contact_email || "", phone: wd.contact_phone || "", address: wd.location || "", hours: [], social: {} }, core_slot: "footer" },
    ];

    if (Object.keys(socialLinks).length > 0) {
      seedSections.push({ type: "social", schema: { handles: socialLinks } });
    }

    const surfaceMetadata = {
      brand: { logo: wd.logo_url, primary_color: wd.primary_color },
      header: { logo_position: wd.logo_position, logo_size: wd.logo_size, show_name: wd.show_business_name },
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
      setEmenuWizardOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create menu");
    }
  }, [user, initAndNavigate]);

  if (!engine) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <p className="text-muted-foreground">Unknown builder category: {sellerKey}</p>
      </div>
    );
  }

  // For emenu, we use a custom entry that still opens the existing EmenuWizard for manual path
  if (engineKey === "emenu") {
    return (
      <>
        <BuilderEntryScreen engine={engine} onComplete={handleComplete} />
        <EmenuWizard
          open={emenuWizardOpen}
          onOpenChange={setEmenuWizardOpen}
          onComplete={handleEmenuWizardComplete}
        />
      </>
    );
  }

  return <BuilderEntryScreen engine={engine} onComplete={handleComplete} />;
}
