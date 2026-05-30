/**
 * Shared ADA category-resolution function.
 *
 * Used by BOTH onboarding entry points (Speak to Build + Chat to Build)
 * to guarantee a single source of truth for builder routing.
 *
 * Source of truth for the rules: YANGU_BUILDER_SPEC.md → ADA Routing Rules.
 *
 * The `sellChannel` arg is the answer to "Where do you plan to sell most?"
 * and overrides text detection in spec-defined cases:
 *   - wholesale     → always Estore
 *   - social_media  → Influencer
 *   - whatsapp      → Community when desc contains coaching / NGO / class
 *   - physical_shop → bias toward Emenu when food/hospitality detected
 *   - online_store  → bias toward Eshop for ambiguous text
 *   - both          → text detection
 *   - not_sure      → text detection
 */

import type { BuilderType } from "@/types/builders";

export type SellChannel =
  | "website"
  | "social_media"
  | "whatsapp"
  | "combination"
  | "online_store"
  | "physical_shop"
  | "both"
  | "wholesale"
  | "not_sure"
  | "";

function rawCategoryFromText(text: string): BuilderType | null {
  const t = (text || "").toLowerCase();
  // Estore = supplier / wholesale / B2B / agri. Match BEFORE eshop so
  // wholesale doesn't fall through to retail.
  if (/\b(wholesale|supplier|bulk|distributor|distribution|trading|warehouse|stockist|importer|exporter|b2b|manufacturer|factory|agri|agriculture|farm|farming|estore|kilimo|ubuhinzi|obulimi|زراع)\b/.test(t)) return "estore";
  if (/\b(creator|influencer|content|tiktok|instagram|social media|muumbaji|umuhanzi|مؤثر)\b/.test(t)) return "influencer";
  if (/\b(eshop|shop|store|retail|product|boutique|duka|iduka|متجر|eduuka)\b/.test(t)) return "eshop";
  if (/\b(emenu|menu|food|restaurant|cafe|chakula|emmere|طعام|ibiryo)\b/.test(t)) return "emenu";
  if (/\b(eservice|service|services|consultancy|consultant|huduma|empeereza|serivisi|خدمات)\b/.test(t)) return "esite";
  if (/\b(community|organisation|organization|ngo|jumuiya|umuryango|ekibinja|مجتمع)\b/.test(t)) return "community";
  return null;
}

const FOOD_RE = /\b(food|restaurant|cafe|kitchen|bakery|menu|chakula|emmere|ibiryo|طعام)\b/i;

export function categoryFromText(
  businessDescription: string,
  sellChannel?: SellChannel,
): BuilderType {
  const detected = rawCategoryFromText(businessDescription);

  // Hard override — wholesale always Estore.
  if (sellChannel === "wholesale") return "estore";

  // Social-first → Influencer regardless of text.
  if (sellChannel === "social_media") return "influencer";

  // WhatsApp + community / coaching context → Community.
  if (sellChannel === "whatsapp") {
    if (detected === "community") return "community";
    if (/\b(coach|coaching|class|teach|tutor|church|ngo|group)\b/i.test(businessDescription)) {
      return "community";
    }
  }

  // Physical shop — bias toward Emenu when food/hospitality detected.
  if (sellChannel === "physical_shop" && FOOD_RE.test(businessDescription)) {
    return "emenu";
  }

  // Online store — bias toward Eshop for ambiguous text.
  if (sellChannel === "online_store" && (detected == null || detected === "esite")) {
    return "eshop";
  }

  // Default: text detection or esite fallback.
  return detected ?? "esite";
}

export { rawCategoryFromText };