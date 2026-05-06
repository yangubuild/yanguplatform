/**
 * Maps a user "tone" / style answer to a real template key.
 * Returns a template key understood by generateWebsiteVariants
 * (e.g. "eshop_aema", "emenu_yumix"). Falls back to a sensible default.
 */
const ESHOP_TONE_MAP: Record<string, string> = {
  playful: "eshop_uncover",
  luxury: "eshop_aema",
  minimal: "eshop_minna",
  bold: "eshop_kanva",
  modern: "eshop_mockhub",
};

const EMENU_TONE_MAP: Record<string, string> = {
  playful: "emenu_yumix",
  luxury: "emenu_plateria",
  minimal: "emenu_sofra",
  bold: "emenu_zooom",
};

const DEFAULTS: Record<string, string> = {
  eshop: "eshop_aema",
  emenu: "emenu_plateria",
  estore: "eshop_aema",
  esite: "",
  influencer: "",
  community: "",
};

export function selectTemplate(engineKey: string, tone?: string | null): string {
  const t = (tone || "").toString().trim().toLowerCase();
  if (engineKey === "eshop" || engineKey === "estore") {
    return ESHOP_TONE_MAP[t] || DEFAULTS.eshop;
  }
  if (engineKey === "emenu") {
    return EMENU_TONE_MAP[t] || DEFAULTS.emenu;
  }
  return DEFAULTS[engineKey] ?? "";
}
