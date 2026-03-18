/**
 * Discovery Monetization Intelligence — Phase 8
 *
 * Controls how paid/premium visibility interacts with trust, relevance,
 * and personalization without breaking ranking fairness.
 *
 * KEY INVARIANTS:
 * - Trust (max 45) + Text relevance (max 40) remain dominant
 * - Premium boost is capped at MAX_PREMIUM_BOOST (5.0 pts)
 * - Trust floor: entities below TRUST_FLOOR get zero premium boost
 * - Verified = trust signal, Paid = exposure signal — no double inflation
 * - Sponsored slots consume existing slot capacity, never create new rows
 */

// ── Constants ──

/** Max additive premium boost (vs trust 45 + text 40 = 85 dominant) */
export const MAX_PREMIUM_BOOST = 5.0;

/** Entities below this trust_score cannot receive any premium boost */
export const TRUST_FLOOR = 25;

/** Max sponsored entities allowed per landing section */
export const MAX_SPONSORED_PER_SECTION = 1;

/** Min trust_score for a sponsored entity to qualify */
export const SPONSORED_TRUST_FLOOR = 30;

/** Max fraction of any section that can be sponsored (e.g., 1/6 ≈ 0.17) */
export const MAX_SPONSORED_FRACTION = 0.20;

// ── Premium boost ──

interface PremiumBoostInput {
  visibility_tier?: string | null;
  is_verified?: boolean;
  trust_score?: number | null;
}

/**
 * Compute premium exposure boost for an entity.
 *
 * Formula:
 *   base = tier weight (premium: 5.0, paid: 3.0, verified-only: 1.0, free: 0)
 *   if verified AND paid → use max(paid, verified) not sum (anti-double-inflation)
 *   if trust_score < TRUST_FLOOR → 0
 *
 * Returns 0–MAX_PREMIUM_BOOST
 */
export function computePremiumBoost(entity: PremiumBoostInput): number {
  const trust = entity.trust_score ?? 0;

  // Trust floor gate
  if (trust < TRUST_FLOOR) return 0;

  const tier = entity.visibility_tier ?? "free";
  const isVerified = entity.is_verified ?? false;

  let tierBoost = 0;
  switch (tier) {
    case "premium":
      tierBoost = 5.0;
      break;
    case "paid":
      tierBoost = 3.0;
      break;
    case "verified":
      tierBoost = 1.0;
      break;
    default:
      tierBoost = 0;
  }

  // Anti-double-inflation: verified is a trust signal already baked into trust_score.
  // If entity is both verified AND paid, use the paid tier boost only (not additive).
  // Verified-only entities get a small 1.0 from tier; paid entities get 3.0+.
  // This prevents verified+paid from getting 4.0 when paid alone gets 3.0.
  if (isVerified && tierBoost > 1.0) {
    // Already paid tier — verified benefit is captured in trust_score, not here
    return Math.min(tierBoost, MAX_PREMIUM_BOOST);
  }

  return Math.min(tierBoost, MAX_PREMIUM_BOOST);
}

// ── Sponsored slot qualification ──

interface SponsoredCandidate {
  trust_score?: number | null;
  is_verified?: boolean;
  visibility_tier?: string | null;
}

/**
 * Check if an entity qualifies for a sponsored slot.
 * Must meet trust floor AND be in a paid/premium tier.
 */
export function qualifiesForSponsored(entity: SponsoredCandidate): boolean {
  const trust = entity.trust_score ?? 0;
  if (trust < SPONSORED_TRUST_FLOOR) return false;

  const tier = entity.visibility_tier ?? "free";
  return tier === "paid" || tier === "premium";
}

/**
 * Compute how many sponsored slots a section can have.
 * Never exceeds MAX_SPONSORED_PER_SECTION or MAX_SPONSORED_FRACTION of total.
 */
export function maxSponsoredSlots(totalSlots: number): number {
  const fractionLimit = Math.floor(totalSlots * MAX_SPONSORED_FRACTION);
  return Math.min(MAX_SPONSORED_PER_SECTION, fractionLimit);
}

// ── Trend bar monetization gate ──

/** Min trust for a premium entity to appear in trend bar */
export const TREND_TRUST_FLOOR = 30;

/**
 * Filter trend entities: premium entities must pass trust floor.
 * Non-premium entities pass through unchanged.
 */
export function filterTrendMonetized<
  T extends { trust_score?: number | null; visibility_tier?: string | null },
>(entities: T[]): T[] {
  return entities.filter((e) => {
    const tier = e.visibility_tier ?? "free";
    if (tier === "paid" || tier === "premium") {
      return (e.trust_score ?? 0) >= TREND_TRUST_FLOOR;
    }
    return true;
  });
}

// ── Related entities monetization safety ──

/** Max fraction of "related" / "you might also like" that can be paid-tier */
export const MAX_RELATED_PAID_FRACTION = 0.30;

/**
 * Ensure related results don't become paid-only surfaces.
 * If paid entities exceed the fraction limit, trim excess paid and backfill with organic.
 */
export function enforceRelatedPaidCap<
  T extends { visibility_tier?: string | null },
>(items: T[]): T[] {
  if (items.length === 0) return items;

  const maxPaid = Math.max(1, Math.floor(items.length * MAX_RELATED_PAID_FRACTION));
  const paid: T[] = [];
  const organic: T[] = [];

  for (const item of items) {
    const tier = item.visibility_tier ?? "free";
    if ((tier === "paid" || tier === "premium") && paid.length < maxPaid) {
      paid.push(item);
    } else if (tier === "paid" || tier === "premium") {
      // Excess paid — skip
    } else {
      organic.push(item);
    }
  }

  // Interleave: organic first, then paid scattered
  const result: T[] = [];
  let pIdx = 0;
  let oIdx = 0;

  for (let i = 0; i < items.length && (oIdx < organic.length || pIdx < paid.length); i++) {
    // Place a paid entity roughly every 1/fraction positions
    if (pIdx < paid.length && (i % Math.ceil(1 / MAX_RELATED_PAID_FRACTION) === 1)) {
      result.push(paid[pIdx++]);
    } else if (oIdx < organic.length) {
      result.push(organic[oIdx++]);
    } else if (pIdx < paid.length) {
      result.push(paid[pIdx++]);
    }
  }

  return result;
}
