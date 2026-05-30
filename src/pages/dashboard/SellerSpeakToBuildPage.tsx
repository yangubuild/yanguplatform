// ARCHITECTURE RULE: generateWebsiteVariants() MUST be called before initAndNavigate().
// AI fills content only. Templates render layout. Never pass seedSections as layout source.
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useBuilderSurfaceInit } from "@/hooks/useBuilderSurfaceInit";
import { getEngine } from "@/lib/builder/engineRegistry";
import { SpeakToBuild } from "@/components/builder/speak-to-build/SpeakToBuild";
import { mergeIntoDefault } from "@/lib/builderDefaults";
import { generateWebsiteVariants } from "@/components/builder-new/utils/websiteGenerator";
import { persistBlobUrls } from "@/lib/builder/persistBlobUrls";
import { supabase } from "@/integrations/supabase/client";
import { selectTemplate } from "@/lib/builder/selectTemplate";
import { VariantPreviewCarousel, type VariantPreviewItem } from "@/components/builder-new/VariantPreviewCarousel";
import { getDefaultVariantsForBuilder, getTemplate } from "@/config/templateRegistry";
import { resolveBuilder } from "@/types/builders";

const SELLER_KEY_MAP: Record<string, string> = {
  emenu: "emenu",
  esite: "esite",
  eshop: "eshop",
  estore: "estore",
};

/**
 * Dedicated full-screen route for the SpeakToBuild voice flow.
 * Mounted OUTSIDE the dashboard shell so nothing can re-render or override
 * the voice UI mid-session.
 */
export default function SellerSpeakToBuildPage() {
  const { sellerKey = "eshop" } = useParams<{ sellerKey: string }>();
  const { user } = useAuth();
  const { initAndNavigate } = useBuilderSurfaceInit();
  const navigate = useNavigate();
  const engineKey = SELLER_KEY_MAP[sellerKey] || sellerKey;
  const engine = getEngine(engineKey);

  // SPEC: ADA must generate 3 variations and the user must pick one BEFORE
  // the editor opens. We stash the generated variants + the rest of the
  // payload here so handleChooseVariant can finalise initAndNavigate.
  const [pendingVariants, setPendingVariants] = useState<VariantPreviewItem[]>([]);
  const [pendingPayload, setPendingPayload] = useState<{
    variants: string[];
    variantKeys: string[];
    businessName: string;
    slug: string;
    seedSections: Array<{ type: string; schema: Record<string, unknown>; core_slot?: string }>;
    metadataBase: Record<string, unknown>;
  } | null>(null);

  const handleComplete = useCallback(async (answers: Record<string, unknown>) => {
    if (!engine || !user?.id) {
      toast.error("You must be logged in");
      return null;
    }
    const businessName = String(
      answers.business_name || answers.display_name || "Untitled"
    );
    const slug = String(
      answers.slug ||
        businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)
    );

    // If SpeakToBuild generated AI sections via builder-ai-generate-draft,
    // use them directly so the editor reflects the same output as Build-with-Chat.
    const aiSections = Array.isArray(answers._ai_sections) ? answers._ai_sections : [];
    const seedSections = aiSections.length > 0
      ? aiSections
          .map((entry) => {
            if (!entry || typeof entry !== "object") return null;
            const e = entry as { type?: string; schema?: Record<string, unknown> };
            if (!e.type) return null;
            return {
              type: e.type,
              schema: mergeIntoDefault(e.type, e.schema || {}),
            };
          })
          .filter((x): x is { type: string; schema: Record<string, unknown> } => !!x)
      : engine.defaultSections.map((s) => {
          const schema = mergeIntoDefault(s.type, s.schema);
          if (s.type === "hero") {
            if (!schema.headline) schema.headline = businessName;
            if (!schema.subheadline && answers.business_description) {
              schema.subheadline = String(answers.business_description);
            }
          }
          return { type: s.type, schema, core_slot: s.core_slot };
        });

    // Templates are the ONLY source of layout. Build 3 variants — one per
    // real template key for this builder (Phase 3: no hardcoded keys, no
    // single-template visual remixes).
    const tone = String(answers.style || answers._speak_style || "");
    const businessType = String(answers.industry || answers.business_description || "");
    // Sanity: resolve to a real template using selectTemplate (also runs
    // assertTemplateOwnership). We don't use its key directly here — the
    // variant set comes from getDefaultVariantsForBuilder — but this catches
    // an unknown engine early.
    selectTemplate(engineKey, tone, businessType);
    const builder = resolveBuilder(engineKey);
    if (!builder) {
      toast.error(`Unknown builder for engine "${engineKey}"`);
      return null;
    }
    const variantKeys = getDefaultVariantsForBuilder(builder);
    const secondaryColor = typeof answers.secondary_color === "string" ? answers.secondary_color : "";
    const primaryColor = String(answers.primary_color || "#2563eb");
    const brandColors = secondaryColor ? [primaryColor, secondaryColor] : [primaryColor];
    const menuItems = Array.isArray(answers.menu_items) ? (answers.menu_items as string[]) : [];
    const productItems = Array.isArray(answers.products) ? (answers.products as string[]) : [];
    const sectionsArr = engineKey === "emenu"
      ? (menuItems.length ? menuItems : productItems)
      : productItems;
    const deliveryAppsArr = engineKey === "emenu" && Array.isArray(answers.delivery_apps)
      ? (answers.delivery_apps as string[])
      : [];
    // Generate one HTML per template key (take first variant of each set).
    const variants = variantKeys.map((tplKey) => {
      const rendered = generateWebsiteVariants({
        category: engineKey as never,
        businessName,
        location: String(answers.location || ""),
        scope: String(answers.scope || "showcase"),
        style: tplKey,
        styleSpecific: tone,
        sections: sectionsArr,
        deliveryApps: deliveryAppsArr,
        userIdea: String(answers.business_description || ""),
        userLogoUrl: typeof answers.logo_url === "string" ? answers.logo_url : undefined,
        userBrandColors: brandColors,
        userImages: [],
      });
      return rendered[0] || "";
    });
    // Show the user all 3 variants. initAndNavigate is deferred until pick.
    setPendingPayload({
      variants,
      variantKeys,
      businessName,
      slug,
      seedSections,
      metadataBase: {
        brand: { primary_color: String(answers.primary_color || "#2563eb") },
        industry: String(answers.industry || ""),
        ai_setup: !!answers._ai_setup,
        ai_source: typeof answers._ai_source === "string" ? answers._ai_source : "speak_to_build",
        ai_answers: answers._ai_answers || {},
        ai_profile: answers._ai_profile || {},
        // Persist new ADA qualification fields when collected.
        country: typeof answers.country === "string" ? answers.country : "",
        products_services: Array.isArray(answers.products_services) ? answers.products_services : [],
        payment_methods: Array.isArray(answers.payment_methods) ? answers.payment_methods : [],
        sell_channel: typeof answers.sell_channel === "string" ? answers.sell_channel : "",
        // Phase 14 wiring: forward community sub-type into surface metadata.
        ...(typeof answers.community_subtype === "string"
          ? { community_subtype: answers.community_subtype }
          : {}),
      },
    });
    setPendingVariants(
      variants.map((html, i) => ({
        html,
        label: getTemplate(engineKey, variantKeys[i])?.label || variantKeys[i],
      })),
    );
    return null;
  }, [engine, engineKey, user, initAndNavigate]);

  const handleChooseVariant = useCallback(async (index: number) => {
    if (!engine || !user?.id || !pendingPayload) return;
    const raw = pendingPayload.variants[index] || pendingPayload.variants[0] || "";
    const chosenTemplateKey =
      pendingPayload.variantKeys[index] || pendingPayload.variantKeys[0] || "default";
    let templateHtml = raw;
    try {
      if (templateHtml) templateHtml = await persistBlobUrls(templateHtml, user.id);
    } catch { /* keep original */ }
    await initAndNavigate({
      surfaceType: engine.surfaceType,
      slug: pendingPayload.slug,
      title: pendingPayload.businessName,
      seedSections: pendingPayload.seedSections,
      metadata: {
        ...pendingPayload.metadataBase,
        builder_new_template: chosenTemplateKey,
        builder_new_html: templateHtml,
      },
    });
  }, [engine, user, pendingPayload, initAndNavigate]);

  if (!engine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Unknown builder category: {sellerKey}</p>
      </div>
    );
  }

  // Variant selection screen — shown after ADA finishes qualifying.
  if (pendingVariants.length > 0) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold">Choose your design</h2>
          <p className="text-xs text-muted-foreground">Pick one of the 3 variations ADA created for you.</p>
        </div>
        <div className="flex-1 min-h-0">
          <VariantPreviewCarousel
            variants={pendingVariants}
            onChoose={handleChooseVariant}
            isGenerating={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <SpeakToBuild
        initialCategory={engineKey as never}
        onComplete={handleComplete}
        onBack={() => navigate(`/dashboard/seller/${sellerKey}`)}
        onSwitchToChat={() => navigate(`/dashboard/seller/${sellerKey}?mode=chat`)}
      />
    </div>
  );
}
