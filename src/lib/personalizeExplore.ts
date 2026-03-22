/**
 * Client-side soft personalization reranker.
 *
 * Takes server-ranked results and applies a small personalization nudge
 * based on session memory signals. The nudge is ADDITIVE and CAPPED
 * so it can only reorder among similarly-ranked items, never overpower
 * trust or relevance.
 *
 * MAX_PERSONALIZATION_BOOST = 3.0 points (vs trust max 45, text max 40).
 * This means personalization can swap two items only if they're within
 * ~3 points of each other in server ranking.
 */

import { getSessionPreferences } from "./sessionMemory";
import { TRUST_FLOOR } from "./monetizationRules";

const MAX_BOOST = 3.0;

interface Personalizable {
  id: string;
  entity_type: string;
  primary_category?: string | null;
  tags?: string[];
  relevance_score?: number;
  relatedness_score?: number;
  trust_score?: number | null;
}

/**
 * Compute a personalization boost for a single entity (0 to MAX_BOOST).
 * Gated: entities with trust_score < 10 get zero boost.
 */
function computeBoost(
  entity: Personalizable,
  prefs: ReturnType<typeof getSessionPreferences>,
): number {
  // Trust gate: weak entities cannot benefit from personalization or monetization
  if ((entity.trust_score ?? 0) < Math.min(10, TRUST_FLOOR)) return 0;

  let boost = 0;

  // Type affinity: up to 1.0
  const typeW = prefs.typeWeights[entity.entity_type] ?? 0;
  boost += typeW * 1.0;

  // Category affinity: up to 1.0
  const catW = entity.primary_category
    ? (prefs.categoryWeights[entity.primary_category] ?? 0)
    : 0;
  boost += catW * 1.0;

  // Tag affinity: up to 1.0 (best matching tag)
  let bestTagW = 0;
  for (const tag of entity.tags ?? []) {
    const w = prefs.tagWeights[tag.toLowerCase()] ?? 0;
    if (w> bestTagW) bestTagW = w;
  }
  boost += bestTagW * 1.0;

  // Anti-repetition: already-clicked entities get slight demotion to encourage exploration
  if (prefs.clickedIds.has(entity.id)) {
    boost -= 0.5;
  }

  return Math.max(0, Math.min(MAX_BOOST, boost));
}

/**
 * Rerank results with soft personalization.
 * Only reorders; never adds or removes items.
 */
export function personalizeResults<T extends Personalizable>(items: T[]): T[] {
  const prefs = getSessionPreferences();

  // If no session history, return unchanged
  const hasSignals =
    Object.keys(prefs.typeWeights).length> 0 ||
    Object.keys(prefs.categoryWeights).length> 0;
  if (!hasSignals) return items;

  // Compute effective score = server score + personalization boost
  const scored = items.map((item) => ({
    item,
    effective:
      (item.relevance_score ?? item.relatedness_score ?? 0) +
      computeBoost(item, prefs),
  }));

  scored.sort((a, b) => b.effective - a.effective);
  return scored.map((s) => s.item);
}
