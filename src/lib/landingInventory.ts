/**
 * Landing Inventory Contracts — Fixed Slot Counts & Weighted Rotation
 *
 * Landing = curated rotating surface. Never expands into extra rows.
 * Explore = full inventory.
 *
 * Phase 10: Rotation incorporates adaptive tuning signals.
 * Population: Bootstrap → Growth phase-aware fill ordering.
 *
 * KEY SURFACES:
 *   4 category rows × 4 slots = 16 key surfaces (with cover images)
 *   16 popular grid surfaces (without cover images)
 *
 * SECTION TITLES (locked):
 *   Verified | Community | Products | Services
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
  /** Category rows: 4 slots each */
  "verified": 4,
  "products": 4,
  "services": 4,
  "community": 4,
  /** Popular grid: 4 rows × 4 columns */
  "popular-grid": 16,
  /** Trend bar: continuous ticker */
  "trend-bar": 20,
} as const;

export type LandingSectionKey = keyof typeof LANDING_SLOTS;

// ── Seeded Accounts (Bootstrap) ──

const SEEDED_EMAILS = [
  "yanguabuild@gmail.com",
  "kafeeroaz@gmail.com",
];

// ── Platform Phase ──

export type PlatformPhase = "bootstrap" | "growth";

/**
 * Determine current platform phase based on inventory health.
 * Growth = enough real surfaces + active subscriptions + ads.
 */
export function detectPlatformPhase(stats: {
  totalPublished: number;
  activeSubscriptions: number;
  activeAds: number;
}): PlatformPhase {
  // Growth threshold: 50+ published surfaces, 10+ subscriptions, or 5+ ads
  if (stats.totalPublished >= 50 && (stats.activeSubscriptions >= 10 || stats.activeAds >= 5)) {
    return "growth";
  }
  return "bootstrap";
}

// ── Fill Source Classification ──

export type FillSource = "ad" | "premium_subscriber" | "mid_subscriber" | "subscribed" | "engagement" | "user_published" | "seeded" | "placeholder";

export interface ClassifiedEntity extends SearchEntityResult {
  fill_source: FillSource;
  /** Owner email if available for seeded detection */
  owner_email?: string;
}

/**
 * Classify an entity's fill source for priority ordering.
 */
function classifyFillSource(
  entity: SearchEntityResult & { owner_email?: string },
  phase: PlatformPhase,
): FillSource {
  const tier = entity.visibility_tier ?? "free";
  const email = entity.owner_email?.toLowerCase() ?? "";
  const isSeeded = SEEDED_EMAILS.some((s) => s.toLowerCase() === email);

  if (tier === "paid" || tier === "premium") {
    // Check if ad-backed or subscription-backed
    if ((entity as any).is_ad_placement) return "ad";
    if (tier === "premium") return "premium_subscriber";
    return "mid_subscriber";
  }

  if ((entity as any).has_subscription) return "subscribed";

  if (isSeeded) return "seeded";

  // Engagement-based: entities with high trust or activity
  if ((entity.trust_score ?? 0) >= 50) return "engagement";

  return "user_published";
}

// ── Phase-Aware Fill Priority ──

const BOOTSTRAP_PRIORITY: Record<FillSource, number> = {
  seeded: 10,              // 1. Seeded surfaces
  user_published: 20,      // 2. Newly published surfaces
  engagement: 30,          // 3. High engagement surfaces
  subscribed: 40,          // 4. Subscribed surfaces
  mid_subscriber: 40,      // (maps to subscribed tier in bootstrap)
  premium_subscriber: 40,  // (maps to subscribed tier in bootstrap)
  ad: 50,                  // 5. Paid ad surfaces
  placeholder: 100,        // 6. Placeholders
};

const GROWTH_PRIORITY: Record<FillSource, number> = {
  ad: 10,                  // 1. Paid ad surfaces
  premium_subscriber: 20,  // 2. Premium subscribers
  mid_subscriber: 30,      // 3. Mid-level subscribers
  engagement: 40,          // 4. High engagement surfaces
  user_published: 50,      // 5. Basic free published surfaces
  subscribed: 50,          // (maps to basic free in growth)
  seeded: 60,              // 6. Seeded surfaces
  placeholder: 100,        // 7. Placeholders
};

function getFillPriority(source: FillSource, phase: PlatformPhase): number {
  return phase === "bootstrap" ? BOOTSTRAP_PRIORITY[source] : GROWTH_PRIORITY[source];
}

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
 */
function computeRotationScore(entity: SearchEntityResult, seenTypes: Set<string>): number {
  let score = 0;

  const relevance = entity.relevance_score ?? 0;
  score += (relevance / 100) * ROTATION_WEIGHTS.trustScore;
  score += (relevance / 100) * ROTATION_WEIGHTS.ranking;

  if (entity.published_at) {
    const ageMs = Date.now() - new Date(entity.published_at).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const freshness = Math.max(0, 1 - ageDays / 365);
    score += freshness * ROTATION_WEIGHTS.freshness;
  }

  if (entity.is_verified) {
    score += ROTATION_WEIGHTS.verifiedBonus;
  }

  const premiumBoost = computePremiumBoost({
    visibility_tier: entity.visibility_tier,
    is_verified: entity.is_verified,
    trust_score: entity.trust_score,
  });
  score += (premiumBoost / 5.0) * ROTATION_WEIGHTS.paidBonus;

  if (seenTypes.has(entity.entity_type)) {
    score -= ROTATION_WEIGHTS.diversityPenalty;
  }

  return score;
}

// ── Manual Override Support ──

let manualOverrides: Map<string, number> | null = null;

/**
 * Set manual ordering overrides from management panel.
 * Map of entity_id → position (lower = higher priority).
 */
export function setManualOverrides(overrides: Map<string, number>): void {
  manualOverrides = overrides.size > 0 ? overrides : null;
}

/**
 * Select `slotCount` entities from a larger pool using phase-aware fill ordering
 * + weighted rotation + adaptive tuning.
 *
 * LOW INVENTORY: If fewer entities than slots, applies controlled repeat
 * (max 2 appearances across key surfaces) then placeholder gaps.
 */
export function rotateForSlots(
  entities: SearchEntityResult[],
  slotCount: number,
  options?: {
    phase?: PlatformPhase;
    /** Track which entity IDs have already appeared in other sections */
    globalAppearances?: Map<string, number>;
  },
): SearchEntityResult[] {
  if (!entities || entities.length === 0) return [];

  const phase = options?.phase ?? "bootstrap";
  const globalAppearances = options?.globalAppearances ?? new Map<string, number>();

  // Apply manual overrides if set — these take absolute precedence
  if (manualOverrides && manualOverrides.size > 0) {
    const overridden = [...entities].sort((a, b) => {
      const posA = manualOverrides!.get(a.id) ?? 9999;
      const posB = manualOverrides!.get(b.id) ?? 9999;
      return posA - posB;
    });
    return overridden.slice(0, slotCount);
  }

  const sessionSeed = getSessionSeed();
  const seenTypes = new Set<string>();

  const scored = entities.map((entity, index) => {
    const fillSource = classifyFillSource(entity, phase);
    const fillPriority = getFillPriority(fillSource, phase);

    // Base rotation score (trust/relevance dominant)
    const base = computeRotationScore(entity, seenTypes);

    // Phase-aware fill priority — normalize to 0–0.3 range so it influences but doesn't overpower
    const fillBonus = (1 - fillPriority / 100) * 0.3;

    // Session jitter
    const jitter = hashJitter(entity.id, sessionSeed) * 0.08;

    seenTypes.add(entity.entity_type);

    return {
      entity,
      score: base + fillBonus + jitter,
      fillSource,
      originalIndex: index,
    };
  });

  // Phase 10: Apply adaptive tuning adjustments
  const rawAdjustments = scored.map((s) => getRotationAdjustment(s.entity.id));
  const fairAdjustments = rawAdjustments.map((adj, i) =>
    applyPaidFairnessGuard(scored[i].entity.id, scored[i].entity.visibility_tier, adj)
  );
  const diverseEntities = scored.map((s) => ({
    entity_type: s.entity.entity_type,
    primary_category: s.entity.primary_category,
  }));
  const finalAdjustments = applyDiversityGuard(diverseEntities, fairAdjustments);

  for (let i = 0; i < scored.length; i++) {
    scored[i].score += finalAdjustments[i];
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Select entities with controlled repeat logic
  const selected: SearchEntityResult[] = [];
  const selectedIds = new Set<string>();

  for (const item of scored) {
    if (selected.length >= slotCount) break;

    const currentAppearances = globalAppearances.get(item.entity.id) ?? 0;

    // Controlled repeat: max 2 visible appearances across ALL key surfaces
    if (currentAppearances >= 2) continue;

    // Never repeat inside same row
    if (selectedIds.has(item.entity.id)) continue;

    selected.push(item.entity);
    selectedIds.add(item.entity.id);
    globalAppearances.set(item.entity.id, currentAppearances + 1);
  }

  return selected;
}

// ── Helpers ──

function getSessionSeed(): number {
  const key = "yangu_rotation_seed";
  let seed: string | null = null;
  try { seed = sessionStorage.getItem(key); } catch {}
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
  return Math.abs(hash % 10000) / 10000;
}
