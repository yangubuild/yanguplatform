/**
 * Maps a user "tone" / style answer to a real template key per engine.
 * Returns a template key understood by generateWebsiteVariants and the
 * template registry. Falls back to a sensible per-engine default.
 *
 * Builder Bible isolation rules enforced here:
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

export function selectTemplate(engineKey: string, tone?: string | null): string {
  const key = SURFACE_TYPE_TO_ENGINE[engineKey] || engineKey;
  const t = (tone || "").toString().trim().toLowerCase();
  if (key === "eshop") {
    return ESHOP_TONE_MAP[t] || DEFAULTS.eshop;
  }
  if (key === "estore") {
    return ESTORE_TONE_MAP[t] || DEFAULTS.estore;
  }
  if (key === "emenu") {
    return EMENU_TONE_MAP[t] || DEFAULTS.emenu;
  }
  return DEFAULTS[key] ?? "";
}
