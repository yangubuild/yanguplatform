/**
 * Trust Expansion Layer — Phase 7
 *
 * Provides verification depth, badge priority, review confidence,
 * and trust-tier classification for public explore surfaces.
 */

// ── Verification depth ──

export type VerificationType = "identity" | "business" | "creator" | "community" | "organization";

export interface VerificationLabel {
  type: VerificationType;
  label: string;
  color: string; // tailwind-safe color token or raw HSL
}

/**
 * Derive the *specific* verification label from entity_type + subtype.
 * Returns null when the entity is not verified — callers must gate on is_verified.
 */
export function getVerificationDepth(
  entityType: string,
  entitySubtype: string | null,
  isVerified: boolean,
): VerificationLabel | null {
  if (!isVerified) return null;

  switch (entityType) {
    case "business":
      return { type: "business", label: "Verified Business", color: "#b5622a" };
    case "creator":
      return { type: "creator", label: "Verified Creator", color: "#3b82f6" };
    case "organization":
      return { type: "organization", label: "Verified Organization", color: "#16a34a" };
    case "community":
      return { type: "community", label: "Verified Community", color: "#16a34a" };
    default:
      return { type: "identity", label: "Verified", color: "#3b82f6" };
  }
}

// ── Badge color (backward-compatible with getVerifiedBadgeColor) ──

export function badgeColorHex(entityType: string): string {
  switch (entityType) {
    case "business":
      return "#b5622a";
    case "organization":
    case "community":
      return "#16a34a";
    default:
      return "#3b82f6";
  }
}

// ── Trust tier classification ──

export type TrustTier = "high" | "moderate" | "emerging" | "low";

export interface TrustTierInfo {
  tier: TrustTier;
  label: string;
  /** CSS color for the label */
  color: string;
  /** Background with alpha for pill */
  bg: string;
}

/**
 * Classify an entity into a trust tier based on its trust_score.
 * Returns null for entities without a trust_score so UI can hide the signal.
 */
export function getTrustTier(trustScore: number | null | undefined): TrustTierInfo | null {
  if (trustScore == null) return null;

  if (trustScore>= 65)
    return { tier: "high", label: "Highly Trusted", color: "rgb(74,222,128)", bg: "rgba(74,222,128,0.1)" };
  if (trustScore>= 40)
    return { tier: "moderate", label: "Trusted", color: "rgb(74,222,128)", bg: "rgba(74,222,128,0.08)" };
  if (trustScore>= 20)
    return { tier: "emerging", label: "Emerging", color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.05)" };
  return { tier: "low", label: "", color: "", bg: "" }; // hidden — low trust entities get no badge
}

// ── Review confidence ──

export type ReviewConfidence = "strong" | "growing" | "early" | "none";

export interface ReviewConfidenceInfo {
  confidence: ReviewConfidence;
  label: string;
  /** Whether the avg rating should be shown prominently */
  showRating: boolean;
}

/**
 * Determine review confidence from count + avg rating.
 * Low-volume entities must not display inflated confidence.
 */
export function getReviewConfidence(
  reviewCount: number | null | undefined,
  avgRating: number | null | undefined,
): ReviewConfidenceInfo {
  const count = reviewCount ?? 0;
  const rating = avgRating ?? 0;

  if (count === 0 || rating === 0)
    return { confidence: "none", label: "", showRating: false };

  if (count>= 10)
    return { confidence: "strong", label: `${count} reviews`, showRating: true };

  if (count>= 3)
    return { confidence: "growing", label: `${count} reviews`, showRating: true };

  // 1-2 reviews: show count but don't emphasize the rating
  return { confidence: "early", label: `${count} review${count> 1 ? "s" : ""}`, showRating: false };
}

// ── Badge priority ──
// When rendering badges, components should follow this order:
// 1. Verification badge (highest priority, most meaningful)
// 2. Trust tier badge (only "Trusted" or "Highly Trusted")
// 3. Rating confidence (stars + count when confidence>= growing)
//
// Max 2 visible badges to prevent clutter.

export const MAX_VISIBLE_BADGES = 2;
