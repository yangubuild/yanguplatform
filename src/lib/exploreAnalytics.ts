/**
 * Explore Analytics — Lightweight exposure & click tracking
 *
 * Privacy-safe: no PII, aggregate-only session IDs, no sensitive profiling.
 * All events inserted into `discovery_events` via anon/authenticated RLS.
 */

import { supabase } from "@/integrations/supabase/client";

// ── Types ──

export type ExploreSurface =
  | "landing_verified"
  | "landing_products"
  | "landing_services"
  | "landing_creators"
  | "landing_community"
  | "popular_grid"
  | "trend_bar"
  | "explore_results"
  | "explore_sponsored"
  | "related_entities"
  | "banner_middle"
  | "banner_lower";

export type EventType = "impression" | "click";

interface TrackableEntity {
  id: string;
  visibility_tier?: string;
  trust_score?: number | null;
  is_verified?: boolean;
}

// ── Trust band classification ──

function getTrustBand(score: number | null | undefined): string | null {
  if (score == null) return null;
  if (score >= 65) return "high";
  if (score >= 40) return "moderate";
  if (score >= 20) return "emerging";
  return "low";
}

// ── Session ID (anonymous, no PII) ──

function getSessionId(): string {
  const key = "yangu_analytics_sid";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    try {
      sessionStorage.setItem(key, sid);
    } catch {}
  }
  return sid;
}

// ── Batched event queue ──

interface QueuedEvent {
  event_type: EventType;
  entity_id: string;
  surface: DiscoverySurface;
  visibility_tier: string | null;
  trust_band: string | null;
  session_id: string;
}

let eventQueue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 3000; // flush every 3s
const MAX_BATCH = 50;

async function flushEvents() {
  if (eventQueue.length === 0) return;
  const batch = eventQueue.splice(0, MAX_BATCH);

  try {
    await supabase.from("discovery_events").insert(batch);
  } catch {
    // Silent fail — analytics should never break the app
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushEvents();
  }, FLUSH_INTERVAL);
}

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushEvents();
    }
  });
}

// ── Public API ──

/**
 * Track an impression or click for a single entity on a surface.
 */
export function trackDiscoveryEvent(
  eventType: EventType,
  entity: TrackableEntity,
  surface: DiscoverySurface,
) {
  eventQueue.push({
    event_type: eventType,
    entity_id: entity.id,
    surface,
    visibility_tier: entity.visibility_tier ?? null,
    trust_band: getTrustBand(entity.trust_score),
    session_id: getSessionId(),
  });
  scheduleFlush();
}

/**
 * Track impressions for a batch of entities shown on a surface.
 * Use with IntersectionObserver for viewport-aware tracking.
 */
export function trackImpressions(
  entities: TrackableEntity[],
  surface: DiscoverySurface,
) {
  const sid = getSessionId();
  for (const entity of entities) {
    eventQueue.push({
      event_type: "impression",
      entity_id: entity.id,
      surface,
      visibility_tier: entity.visibility_tier ?? null,
      trust_band: getTrustBand(entity.trust_score),
      session_id: sid,
    });
  }
  scheduleFlush();
}

/**
 * Track a click on a specific entity.
 */
export function trackClick(
  entity: TrackableEntity,
  surface: DiscoverySurface,
) {
  trackDiscoveryEvent("click", entity, surface);
}

/**
 * Track a banner impression or click.
 */
export function trackBannerEvent(
  eventType: EventType,
  slot: "middle" | "lower",
) {
  const surface: DiscoverySurface = slot === "middle" ? "banner_middle" : "banner_lower";
  eventQueue.push({
    event_type: eventType,
    entity_id: `banner_${slot}`,
    surface,
    visibility_tier: null,
    trust_band: null,
    session_id: getSessionId(),
  });
  scheduleFlush();
}
