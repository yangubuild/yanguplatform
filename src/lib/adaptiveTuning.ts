/**
 * Phase 10 — Adaptive Exposure Tuning Engine
 *
 * Uses analytics signals (exposure_tuning_signals table) to softly adjust
 * rotation scoring without rewriting the ranking hierarchy.
 *
 * KEY INVARIANTS:
 * - Trust + relevance remain dominant (max 85 pts)
 * - Tuning adjustments are TINY (max ±0.15 rotation weight units)
 * - Trust floor from Phase 8 remains enforced
 * - Paid entities obey all fairness caps
 * - Diversity is preserved — no filter bubbles
 */

import { supabase } from "@/integrations/supabase/client";

// ── Types ──

export interface ExposureTuningSignal {
  entity_id: string;
  impressions_7d: number;
  clicks_7d: number;
  ctr_7d: number;
  overexposure_score: number;
  cooldown_factor: number;
  ctr_boost: number;
  trend_engagement_score: number;
}

export interface BannerOptimizationSignal {
  slot: string;
  impressions_7d: number;
  clicks_7d: number;
  ctr_7d: number;
  recommended_weight: number;
}

// ── Constants ──

/** Max CTR-based rotation adjustment — tiny so trust stays dominant */
const MAX_CTR_ADJUSTMENT = 0.15;

/** Max cooldown penalty applied to overexposed entities */
const MAX_COOLDOWN_PENALTY = 0.30;

/** Min cooldown factor (never fully suppress an entity) */
const MIN_COOLDOWN = 0.70;

/** Diversity preservation: max same-category boost from CTR */
const MAX_CATEGORY_CTR_SHARE = 0.40;

// ── Signal Cache ──

let signalCache: Map<string, ExposureTuningSignal> = new Map();
let bannerCache: Map<string, BannerOptimizationSignal> = new Map();
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch tuning signals from the database with caching.
 * Silent fail — optimization is non-critical.
 */
export async function fetchTuningSignals(): Promise<Map<string, ExposureTuningSignal>> {
  if (Date.now() - lastFetchTime < CACHE_TTL && signalCache.size> 0) {
    return signalCache;
  }

  try {
    const { data, error } = await supabase
      .from("exposure_tuning_signals")
      .select("*");

    if (!error && data) {
      const map = new Map<string, ExposureTuningSignal>();
      for (const row of data) {
        map.set(row.entity_id, {
          entity_id: row.entity_id,
          impressions_7d: row.impressions_7d,
          clicks_7d: row.clicks_7d,
          ctr_7d: Number(row.ctr_7d),
          overexposure_score: Number(row.overexposure_score),
          cooldown_factor: Number(row.cooldown_factor),
          ctr_boost: Number(row.ctr_boost),
          trend_engagement_score: Number(row.trend_engagement_score),
        });
      }
      signalCache = map;
      lastFetchTime = Date.now();
    }
  } catch {
    // Silent — analytics never breaks the app
  }

  return signalCache;
}

/**
 * Fetch banner optimization signals with caching.
 */
export async function fetchBannerSignals(): Promise<Map<string, BannerOptimizationSignal>> {
  if (Date.now() - lastFetchTime < CACHE_TTL && bannerCache.size> 0) {
    return bannerCache;
  }

  try {
    const { data, error } = await supabase
      .from("banner_optimization_signals")
      .select("*");

    if (!error && data) {
      const map = new Map<string, BannerOptimizationSignal>();
      for (const row of data) {
        map.set(row.slot, {
          slot: row.slot,
          impressions_7d: row.impressions_7d,
          clicks_7d: row.clicks_7d,
          ctr_7d: Number(row.ctr_7d),
          recommended_weight: Number(row.recommended_weight),
        });
      }
      bannerCache = map;
    }
  } catch {
    // Silent
  }

  return bannerCache;
}

// ── Rotation Adjustments ──

/**
 * Get adaptive rotation adjustment for an entity.
 *
 * Returns a small modifier (typically -0.15 to +0.15) to apply
 * to the base rotation score in landingInventory.
 *
 * Components:
 * 1. CTR boost: high CTR → small positive; low CTR → slight negative
 * 2. Cooldown: overexposed entities get dampened
 *
 * Both are tiny relative to trust (0.35 weight) + ranking (0.25 weight).
 */
export function getRotationAdjustment(entityId: string): number {
  const signal = signalCache.get(entityId);
  if (!signal) return 0;

  let adjustment = 0;

  // CTR-aware boost (Part B)
  // Capped at MAX_CTR_ADJUSTMENT so it never overpowers trust
  adjustment += Math.max(-MAX_CTR_ADJUSTMENT / 2, Math.min(MAX_CTR_ADJUSTMENT, signal.ctr_boost));

  // Cooldown penalty for overexposed entities (Part C)
  // cooldown_factor is 0.7–1.0; we convert to a penalty of 0 to -0.30
  const cooldownPenalty = (1.0 - signal.cooldown_factor) * MAX_COOLDOWN_PENALTY / (1.0 - MIN_COOLDOWN);
  adjustment -= Math.min(MAX_COOLDOWN_PENALTY, cooldownPenalty);

  return adjustment;
}

/**
 * Get trend engagement score for an entity.
 * Used by trend bar to self-calibrate (Part F).
 *
 * Returns 0–1 where:
 * - 1.0 = strong engagement on trend surface
 * - 0.3 = weak engagement
 * - 0 = no data
 */
export function getTrendEngagement(entityId: string): number {
  const signal = signalCache.get(entityId);
  return signal?.trend_engagement_score ?? 0;
}

// ── Banner Optimization (Part D) ──

/**
 * Get recommended rotation weight for a banner slot.
 * Range: 0.8–1.2 (subtle shift, preserves banner contracts).
 */
export function getBannerWeight(slot: string): number {
  const signal = bannerCache.get(slot);
  return signal?.recommended_weight ?? 1.0;
}

// ── Diversity Guard (Part G) ──

interface DiversityInput {
  entity_type: string;
  primary_category?: string | null;
}

/**
 * Apply diversity dampening to prevent filter bubbles.
 * If one category is getting disproportionate CTR boosts,
 * subsequent entities of the same category get diminishing returns.
 */
export function applyDiversityGuard(
  entities: DiversityInput[],
  adjustments: number[],
): number[] {
  const categoryBoostCount: Record<string, number> = {};

  return adjustments.map((adj, i) => {
    const cat = entities[i].primary_category ?? entities[i].entity_type;

    if (adj> 0) {
      const count = categoryBoostCount[cat] ?? 0;
      categoryBoostCount[cat] = count + 1;

      // After a category has received multiple boosts, diminish further ones
      if (count>= 3) {
        return adj * 0.3; // Heavy diminish
      }
      if (count>= 2) {
        return adj * 0.6; // Moderate diminish
      }
    }

    return adj;
  });
}

// ── Paid Fairness Protection (Part E) ──

/**
 * Ensure paid entities don't gain unfair advantage from CTR optimization.
 * Paid entities get at most 50% of the CTR boost that organic entities get.
 */
export function applyPaidFairnessGuard(
  entityId: string,
  visibilityTier: string | null | undefined,
  rawAdjustment: number,
): number {
  const tier = visibilityTier ?? "free";
  if (tier === "paid" || tier === "premium") {
    // Paid entities get reduced CTR boost benefit
    // They already have premium boost from Phase 8
    return rawAdjustment> 0 ? rawAdjustment * 0.5 : rawAdjustment;
  }
  return rawAdjustment;
}

/**
 * Pre-warm the signal cache. Call once on app init or landing load.
 * Non-blocking, silent on failure.
 */
export function preWarmTuningCache(): void {
  fetchTuningSignals();
  fetchBannerSignals();
}
