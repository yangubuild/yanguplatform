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
  // Community — Events / Courses / Freelance. Match BEFORE influencer so
  // "creative" / "designer" / "photographer" route to Freelance, not bio.
  if (/\b(event|events|ticketing|conference|workshop|meetup|festival|expo|hackathon)\b/.test(t)) return "community";
  if (/\b(course|courses|training|coaching|academy|e-learning|elearning|bootcamp|tutor|tutoring|class|classes|masterclass|curriculum)\b/.test(t)) return "community";
  if (/\b(freelance|freelancer|portfolio|consultant|independent contractor|sole trader|self-employed|self employed|gig worker|creative|designer|developer|photographer|videographer|writer|copywriter|virtual assistant|agency)\b/.test(t)) return "community";
  if (/\b(creator|influencer|content|tiktok|instagram|social media|muumbaji|umuhanzi|مؤثر)\b/.test(t)) return "influencer";
  if (/\b(eshop|shop|store|retail|product|boutique|duka|iduka|متجر|eduuka)\b/.test(t)) return "eshop";
  if (/\b(emenu|menu|food|restaurant|cafe|chakula|emmere|طعام|ibiryo)\b/.test(t)) return "emenu";
  if (/\b(eservice|service|services|consultancy|consultant|huduma|empeereza|serivisi|خدمات)\b/.test(t)) return "esite";
  if (/\b(community|organisation|organization|ngo|jumuiya|umuryango|ekibinja|مجتمع|church|club|coach|educator)\b/.test(t)) return "community";
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

  // Coach with premises → Esite. Coach selling online → Community (courses).
  if (sellChannel === "physical_shop" && /\b(coach|coaching)\b/i.test(businessDescription)) {
    return "esite";
  }
  if (sellChannel === "online_store" && /\b(coach|coaching|course|tutor)\b/i.test(businessDescription)) {
    return "community";
  }

  // Online store — bias toward Eshop for ambiguous text.
  if (sellChannel === "online_store" && (detected == null || detected === "esite")) {
    return "eshop";
  }

  // Default: text detection or esite fallback.
  return detected ?? "esite";
}

export { rawCategoryFromText };

/**
 * Community sub-type detection. Stored in builder_surfaces.metadata
 * .community_subtype at surface creation to drive editor quick actions.
 */
export type CommunitySubtype = "events" | "courses" | "freelance";

export function communitySubtypeFromText(
  text: string,
): CommunitySubtype | undefined {
  const t = (text || "").toLowerCase();
  if (/\b(event|events|ticketing|conference|meetup|festival|expo|hackathon)\b/.test(t)) return "events";
  if (/\b(course|courses|training|coaching|academy|e-learning|elearning|bootcamp|tutor|tutoring|class|classes|masterclass|curriculum)\b/.test(t)) return "courses";
  if (/\b(freelance|freelancer|portfolio|consultant|independent contractor|sole trader|self-employed|gig worker|designer|developer|photographer|videographer|writer|copywriter|virtual assistant|agency)\b/.test(t)) return "freelance";
  return undefined;
}