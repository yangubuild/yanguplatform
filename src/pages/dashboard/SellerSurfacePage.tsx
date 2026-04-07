import { useCallback } from "react";
import { useBuilderSurfaceInit } from "@/hooks/useBuilderSurfaceInit";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getEngine } from "@/lib/builder/engineRegistry";
import { BuilderEntryScreen } from "@/components/builder/BuilderEntryScreen";
import { BuilderAiOnboarding } from "@/components/builder/BuilderAiOnboarding";
import { mergeIntoDefault } from "@/lib/builderDefaults";
import BuilderNewPage from "@/pages/BuilderNewPage";

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
    const contactSchema = sections[contactIdx].schema;
    const footerSchema = sections[footerIdx].schema;
    if (!footerSchema.email && contactSchema.email) footerSchema.email = contactSchema.email;
    if (!footerSchema.phone && contactSchema.phone) footerSchema.phone = contactSchema.phone;
    if (!footerSchema.address && contactSchema.address) footerSchema.address = contactSchema.address;
    sections.splice(contactIdx, 1);
  } else if (contactIdx >= 0 && footerIdx < 0) {
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
 * For emenu, redirects to the new builder chat flow (/builder/new?category=emenu).
 * For other categories, it uses the generic BuilderManualWizard via BuilderEntryScreen.
 */
export default function SellerSurfacePage({ sellerKey }: Props) {
  const { user } = useAuth();
  const { initAndNavigate } = useBuilderSurfaceInit();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const engineKey = SELLER_KEY_MAP[sellerKey] || sellerKey;
  const engine = getEngine(engineKey);
  const mode = searchParams.get("mode");

  // Shared chat path handler
  const handleChatPath = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.set("mode", "ai");
    setSearchParams(next, { replace: false });
  }, [searchParams, setSearchParams]);

  // AI onboarding path handler
  const handleAiPath = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.set("mode", "ai_onboarding");
    setSearchParams(next, { replace: false });
  }, [searchParams, setSearchParams]);

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

    if (import.meta.env.DEV) console.log("AI_BUILD_START", {
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

  if (!engine) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <p className="text-muted-foreground">Unknown builder category: {sellerKey}</p>
      </div>
    );
  }

  // If mode=ai, show the embedded chat flow within the dashboard shell
  if (mode === "ai") {
    return <BuilderNewPage embedded initialCategory={engineKey} onBack={() => { const next = new URLSearchParams(searchParams); next.delete("mode"); setSearchParams(next, { replace: true }); }} />;
  }

  // If mode=ai_onboarding, show the Build with AI flow (social imports → auto-generate → template preview)
  if (mode === "ai_onboarding") {
    return (
      <div className="min-h-screen bg-background">
        <BuilderAiOnboarding
          engine={engine}
          onComplete={handleComplete}
          onBack={() => { const next = new URLSearchParams(searchParams); next.delete("mode"); setSearchParams(next, { replace: true }); }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BuilderEntryScreen
        engine={engine}
        onComplete={handleComplete}
        onChatPath={handleChatPath}
        onAiPath={handleAiPath}
      />
    </div>
  );
}
