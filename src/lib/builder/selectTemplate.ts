import {
  type SurfaceType,
  type BuilderType,
  type TemplateSelection,
  type AnyTemplateKey,
  SURFACE_TO_BUILDER,
  assertTemplateOwnership,
  resolveBuilder,
} from "@/types/builders";

/**
 * Maps a user "tone" / style answer to a real template key per engine.
 * Returns a template key understood by generateWebsiteVariants and the
 * template registry. Falls back to a sensible per-engine default.
 *
 * Builder Bible isolation rules enforced here (compile-time via SurfaceType
 * + runtime via assertTemplateOwnership):
 *   - Eshop templates may NEVER appear in Estore routing
 *   - Emenu templates may NEVER appear in any other engine
 *   - Influencer templates may NEVER appear in Community
 *   - Community templates may NEVER appear in Influencer
 */
const ESHOP_TONE_MAP: Record<string, string> = {
  playful: "eshop_uncover",
  luxury: "eshop_aema",
  // eshop_minna moved to Estore registry (Builder Bible). Map "minimal"
  // tone for Eshop to the clean lifestyle template instead.
  minimal: "eshop_visual_a",
  bold: "eshop_kanva",
  modern: "eshop_mockhub",
};

const EMENU_TONE_MAP: Record<string, string> = {
  playful: "emenu_yumix",
  luxury: "emenu_plateria",
  minimal: "emenu_sofra",
  bold: "emenu_zooom",
};

const ESTORE_TONE_MAP: Record<string, string> = {
  minimal: "estore_minna",
  luxury: "estore_visual_b",
  modern: "estore_visual_a",
  bold: "estore_visual_b",
  playful: "estore_visual_a",
};

const DEFAULTS: Record<string, string> = {
  eshop: "eshop_aema",
  emenu: "emenu_plateria",
  // Estore must NEVER fall back to an Eshop template (was eshop_aema).
  estore: "estore_visual_a",
  esite: "",
  // Influencer / Community previously returned "" → blank canvas.
  // Provide real defaults so the editor always loads a template.
  influencer: "influencer_layout_a",
  community: "community_visual_a",
};

// Accept both engine keys ("estore", "influencer", "community") and the raw
// surface_type stored on builder_surfaces ("store_listing", "live_bio",
// "community_group"). Callers may use either form.
const SURFACE_TYPE_TO_ENGINE: Record<string, string> = {
  store_listing: "estore",
  live_bio: "influencer",
  live_selling: "influencer",
  community_group: "community",
  community_listing: "community",
  quick_site: "esite",
};

/**
 * Accepts either a SurfaceType ('store_listing', 'live_bio', ...) OR a
 * legacy engine key ('estore', 'influencer', ...). Returns the typed
 * TemplateSelection contract from YANGU_BUILDER_SPEC.
 *
 * Callers that only need the string key can read `.template_key`.
 */
export function selectTemplate(
  surfaceOrEngine: SurfaceType | string,
  tone?: string | null,
): TemplateSelection {
  const engine = SURFACE_TYPE_TO_ENGINE[surfaceOrEngine] || surfaceOrEngine;
  const t = (tone || "").toString().trim().toLowerCase();

  let templateKey = "";
  if (engine === "eshop") templateKey = ESHOP_TONE_MAP[t] || DEFAULTS.eshop;
  else if (engine === "estore") templateKey = ESTORE_TONE_MAP[t] || DEFAULTS.estore;
  else if (engine === "emenu") templateKey = EMENU_TONE_MAP[t] || DEFAULTS.emenu;
  else templateKey = DEFAULTS[engine] ?? "";

  const builder: BuilderType =
    resolveBuilder(surfaceOrEngine) ?? (engine as BuilderType);

  // Resolve the corresponding canonical SurfaceType for the contract.
  // Reverse SURFACE_TO_BUILDER: pick the surface_type whose builder matches.
  const surface_type = (Object.keys(SURFACE_TO_BUILDER) as SurfaceType[])
    .find((s) => SURFACE_TO_BUILDER[s] === builder) ?? ("eshop" as SurfaceType);

  // Runtime guard — throws if template_key ever escapes its owning builder.
  if (templateKey) {
    assertTemplateOwnership(templateKey, builder);
  }

  return {
    surface_type,
    builder,
    template_key: templateKey as AnyTemplateKey,
    engine,
  };
}
