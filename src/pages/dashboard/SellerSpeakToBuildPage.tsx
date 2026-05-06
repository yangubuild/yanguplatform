// ARCHITECTURE RULE: generateWebsiteVariants() MUST be called before initAndNavigate().
// AI fills content only. Templates render layout. Never pass seedSections as layout source.
import { useCallback } from "react";
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

    // Templates are the ONLY source of layout. Render real template HTML now.
    const tone = String(answers.style || answers._speak_style || "");
    const templateKey = selectTemplate(engineKey, tone);
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
    const variants = generateWebsiteVariants({
      category: engineKey as never,
      businessName,
      location: String(answers.location || ""),
      scope: String(answers.scope || "showcase"),
      style: templateKey,
      styleSpecific: tone,
      sections: sectionsArr,
      deliveryApps: deliveryAppsArr,
      userIdea: String(answers.business_description || ""),
      userLogoUrl: typeof answers.logo_url === "string" ? answers.logo_url : undefined,
      userBrandColors: brandColors,
      userImages: [],
    });
    let templateHtml = variants[0] || "";
    try {
      if (templateHtml) templateHtml = await persistBlobUrls(templateHtml, user.id);
    } catch { /* keep original */ }

    return initAndNavigate({
      surfaceType: engine.surfaceType,
      slug,
      title: businessName,
      seedSections,
      metadata: {
        brand: { primary_color: String(answers.primary_color || "#2563eb") },
        industry: String(answers.industry || ""),
        ai_setup: !!answers._ai_setup,
        ai_source: typeof answers._ai_source === "string" ? answers._ai_source : "speak_to_build",
        ai_answers: answers._ai_answers || {},
        ai_profile: answers._ai_profile || {},
        builder_new_template: templateKey || "default",
        builder_new_html: templateHtml,
      },
    });
  }, [engine, engineKey, user, initAndNavigate]);

  if (!engine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Unknown builder category: {sellerKey}</p>
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
