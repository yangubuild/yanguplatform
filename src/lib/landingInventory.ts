/**
 * Landing Inventory Contracts — Fixed Slot Counts & Weighted Rotation
 *
 * Landing = curated rotating surface. Never expands into extra rows.
 * Explore = full inventory.
 *
 * Phase 10: Rotation now incorporates adaptive tuning signals
 * (CTR boost + cooldown) from the exposure tuning engine.
 */

import type { SearchEntityResult } from "@/types/search";
import { computePremiumBoost, TRUST_FLOOR } from "@/lib/monetizationRules";
import {
  getRotationAdjustment,
  applyPaidFairnessGuard,
  applyDiversityGuard,
} from "@/lib/adaptiveTuning";

// ── Fixed visible slot counts per section ──

export const LANDING_SLOTS = {
  /** Horizontal scrollable row sections */
  "verified-businesses": 6,
  "products": 6,
  "services": 6,
  "influencers-creators": 6,
  "community": 6,
  /** Popular grid: 2 rows × 4 columns on desktop */
  "popular-grid": 8,
  /** Trend bar: continuous ticker, no row expansion */
  "trend-bar": 20,
} as const;

export type LandingSectionKey = keyof typeof LANDING_SLOTS;

// ── Weighted Rotation ──

interface RotationWeights {
  trustScore: number;
  ranking: number;
  freshness: number;
  verifiedBonus: number;
  paidBonus: number;
  diversityPenalty: number;
}

const ROTATION_WEIGHTS: RotationWeights = {
  trustScore: 0.35,
  ranking: 0.25,
  freshness: 0.20,
  verifiedBonus: 0.10,
  paidBonus: 0.05,
  diversityPenalty: 0.05,
};

/**
 * Compute a rotation score for an entity.
 * Higher score = more likely to appear in the visible slot window.
 */
function computeRotationScore(entity: SearchEntityResult, seenTypes: Set<string>): number {
  let score = 0;

  // Relevance score from server (already encodes trust + text match)
  const relevance = entity.relevance_score ?? 0;
  score += (relevance / 100) * ROTATION_WEIGHTS.trustScore;

  // Server ranking position — use relevance as proxy since results come pre-ranked
  score += (relevance / 100) * ROTATION_WEIGHTS.ranking;

  // Freshness: prefer entities published more recently
  if (entity.published_at) {
    const ageMs = Date.now() - new Date(entity.published_at).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const freshness = Math.max(0, 1 - ageDays / 365);
    score += freshness * ROTATION_WEIGHTS.freshness;
  }

  // Verified bonus
  if (entity.is_verified) {
    score += ROTATION_WEIGHTS.verifiedBonus;
  }

  // Monetized premium boost (Phase 8) — gated by trust floor
  const premiumBoost = computePremiumBoost({
    visibility_tier: entity.visibility_tier,
    is_verified: entity.is_verified,
    trust_score: entity.trust_score,
  });
  // Normalize premium boost (max 5.0) into the 0–1 weight budget
  score += (premiumBoost / 5.0) * ROTATION_WEIGHTS.paidBonus;

  // Diversity penalty: if we've already seen this type, penalize slightly
  if (seenTypes.has(entity.entity_type)) {
    score -= ROTATION_WEIGHTS.diversityPenalty;
  }

  return score;
}

/**
 * Select `slotCount` entities from a larger pool using weighted rotation.
 * Adds deterministic per-session jitter so different page loads show different selections.
 *
 * Phase 10: Now applies adaptive tuning adjustments (CTR boost + cooldown)
 * with paid fairness guard and diversity dampening.
 */
export function rotateForSlots(
  entities: SearchEntityResult[],
  slotCount: number,
): SearchEntityResult[] {
  if (!entities || entities.length <= slotCount) return entities ?? [];

  // Session-stable jitter seed (changes per browser session)
  const sessionSeed = getSessionSeed();

  const seenTypes = new Set<string>();
  const scored = entities.map((entity, index) => {
    const base = computeRotationScore(entity, seenTypes);
    // Add small deterministic jitter based on entity id + session
    const jitter = hashJitter(entity.id, sessionSeed) * 0.08;
    seenTypes.add(entity.entity_type);
    return { entity, score: base + jitter, originalIndex: index };
  });

  // Phase 10: Apply adaptive tuning adjustments
  const rawAdjustments = scored.map((s) => getRotationAdjustment(s.entity.id));

  // Paid fairness guard: paid entities get reduced CTR benefit
  const fairAdjustments = rawAdjustments.map((adj, i) =>
    applyPaidFairnessGuard(scored[i].entity.id, scored[i].entity.visibility_tier, adj)
  );

  // Diversity guard: prevent filter bubbles from CTR concentration
  const diverseEntities = scored.map((s) => ({
    entity_type: s.entity.entity_type,
    primary_category: s.entity.primary_category,
  }));
  const finalAdjustments = applyDiversityGuard(diverseEntities, fairAdjustments);

  // Apply adjustments to scores
  for (let i = 0; i < scored.length; i++) {
    scored[i].score += finalAdjustments[i];
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Take top N slots
  return scored.slice(0, slotCount).map((s) => s.entity);
}

// ── Helpers ──

function getSessionSeed(): number {
  const key = "yangu_rotation_seed";
  let seed = sessionStorage.getItem(key);
  if (!seed) {
    seed = String(Math.floor(Math.random() * 100000));
    try { sessionStorage.setItem(key, seed); } catch {}
  }
  return parseInt(seed, 10);
}

function hashJitter(id: string, seed: number): number {
  let hash = seed;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  // Normalize to 0-1
  return Math.abs(hash % 10000) / 10000;
}
