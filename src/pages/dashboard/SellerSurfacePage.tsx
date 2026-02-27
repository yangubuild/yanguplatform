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

// Map AI section types to core_slot values

const CORE_SLOT_MAP: Record<string, string> = {
  header: "header",
  hero: "hero",
  products: "main_content",
  menu: "main_content",
  categories: "main_content",
  collections: "main_content",
  listings: "main_content",
  services: "main_content",
  offer: "offer",
  contact: "contact",
  footer: "footer",
};

const toAiSeedSections = (value: unknown): { type: string; schema: Record<string, unknown>; core_slot?: string }[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const type = typeof entry.type === "string" ? entry.type : null;
      if (!type) return null;
      const rawSchema = isRecord(entry.schema) ? entry.schema : {};
      const schema = mergeIntoDefault(type, rawSchema);
      const core_slot = CORE_SLOT_MAP[type];
      return { type, schema, ...(core_slot ? { core_slot } : {}) };
    })
    .filter((entry): entry is { type: string; schema: Record<string, unknown>; core_slot?: string } => !!entry);
};

/** Ensure AI-generated sections include all core slots and merge contact→footer to prevent duplicates */
function ensureCoreSections(
  aiSections: { type: string; schema: Record<string, unknown>; core_slot?: string }[],
  businessName: string,
  answers: Record<string, unknown>,
): { type: string; schema: Record<string, unknown>; core_slot?: string }[] {
  const sections = [...aiSections];
  const types = new Set(sections.map((s) => s.type));

  // Always ensure header
  if (!types.has("header")) {
    sections.unshift({
      type: "header",
      schema: mergeIntoDefault("header", { logo_url: "", show_name: true, name_next_to_logo: true }),
      core_slot: "header",
    });
  }

  // Ensure hero
  if (!types.has("hero")) {
    sections.splice(types.has("header") ? 1 : 0, 0, {
      type: "hero",
      schema: mergeIntoDefault("hero", { headline: businessName, subheadline: String(answers.business_description || "") }),
      core_slot: "hero",
    });
  }

  // Merge contact data into footer to prevent duplicate contact blocks
  const contactIdx = sections.findIndex((s) => s.type === "contact");
  const footerIdx = sections.findIndex((s) => s.type === "footer");
  
  if (contactIdx >= 0 && footerIdx >= 0) {
    // Merge contact fields into footer and remove standalone contact
    const contactSchema = sections[contactIdx].schema;
    const footerSchema = sections[footerIdx].schema;
    if (!footerSchema.email && contactSchema.email) footerSchema.email = contactSchema.email;
    if (!footerSchema.phone && contactSchema.phone) footerSchema.phone = contactSchema.phone;
    if (!footerSchema.address && contactSchema.address) footerSchema.address = contactSchema.address;
    sections.splice(contactIdx, 1);
  } else if (contactIdx >= 0 && footerIdx < 0) {
    // No footer but contact exists — convert contact to footer
    const contact = sections[contactIdx];
    sections[contactIdx] = {
      type: "footer",
      schema: mergeIntoDefault("footer", {
        heading: "Footer",
        email: String(contact.schema.email || ""),
        phone: String(contact.schema.phone || ""),
        address: String(contact.schema.address || ""),
      }),
      core_slot: "footer",
    };
  }

  // Ensure footer exists
  if (!sections.some((s) => s.type === "footer")) {
    sections.push({
      type: "footer",
      schema: mergeIntoDefault("footer", {
        heading: "Footer",
        email: String(answers.contact_email || ""),
        phone: String(answers.contact_phone || ""),
        address: String(answers.location || ""),
      }),
      core_slot: "footer",
    });
  }

  // Store business metadata in hero if available from Google
  const heroSection = sections.find((s) => s.type === "hero");
  if (heroSection) {
    if (!heroSection.schema.headline || heroSection.schema.headline === "Your Headline") {
      heroSection.schema.headline = businessName;
    }
    if (!heroSection.schema.subheadline && answers.business_description) {
      heroSection.schema.subheadline = String(answers.business_description);
    }
  }

  return sections;
}


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
      ? ensureCoreSections(aiSeedSections, businessName, answers)
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
    const photos = Array.isArray(answers.photos) ? answers.photos : [];

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
    const primaryColor = String(answers.primary_color || "#2563eb");
    metadata.brand = { primary_color: primaryColor };
    if (photos.length > 0) metadata.photos = photos;
    metadata.industry = String(answers.industry || "");
    
    // Store structured business data for future use (no secrets, just public info)
    metadata.business = {
      name: businessName,
      phone: String(answers.contact_phone || ""),
      address: String(answers.location || ""),
      website: String(answers.website || ""),
      category: String(answers.industry || ""),
      description: String(answers.business_description || ""),
      google_maps_url: String(answers.google_maps_url || ""),
      photos: photos,
    };

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
