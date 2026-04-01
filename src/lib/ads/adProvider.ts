/**
 * YANGU Ad Provider Adapter — AdMob-first with future direct campaign support.
 * Provider-safe: returns null when no inventory is available instead of throwing.
 */

import { supabase } from "@/integrations/supabase/client";
import type { AdProvider } from "./types";

export interface ServedAd {
  ad_id: string;
  provider: AdProvider;
  format: string;
  duration_seconds: number;
  media_url: string | null;
  image_url: string | null;
  cta_text: string | null;
  cta_url: string | null;
  campaign_id: string | null;
}

/** Provider readiness flags — flip to true when integration is live */
const PROVIDER_READY: Record<AdProvider, boolean> = {
  admob: false,
  direct: false,
  internal: false,
};

export function isAdProviderReady(provider: AdProvider): boolean {
  return PROVIDER_READY[provider] === true;
}

/**
 * Get an available ad for a given placement slot.
 * Tries direct inventory first, then falls back to AdMob/network.
 * Returns null if nothing is available (provider-safe).
 */
export async function getAvailableAdForPlacement(
  slotKey: string
): Promise<ServedAd | null> {
  // Try direct campaigns first
  if (PROVIDER_READY.direct) {
    const directAd = await fetchDirectAd(slotKey);
    if (directAd) return directAd;
  }

  // AdMob fallback
  if (PROVIDER_READY.admob) {
    return fetchAdMobAd(slotKey);
  }

  // Internal fallback
  if (PROVIDER_READY.internal) {
    return fetchInternalAd(slotKey);
  }

  // No provider ready
  return null;
}

/** Stub: fetch a direct advertiser campaign ad */
async function fetchDirectAd(slotKey: string): Promise<ServedAd | null> {
  try {
    const { data } = await supabase
      .from("ads")
      .select("id, image_url, video_url, cta_text, cta_url, duration_seconds, advertiser_id")
      .eq("status", "active")
      .eq("provider", "direct")
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    return {
      ad_id: data.id,
      provider: "direct",
      format: data.video_url ? "rewarded_video" : "image",
      duration_seconds: data.duration_seconds ?? 15,
      media_url: data.video_url ?? null,
      image_url: data.image_url ?? null,
      cta_text: data.cta_text ?? null,
      cta_url: data.cta_url ?? null,
      campaign_id: null,
    };
  } catch {
    return null;
  }
}

/** Stub: AdMob adapter — to be implemented with real SDK */
async function fetchAdMobAd(_slotKey: string): Promise<ServedAd | null> {
  // Will integrate with AdMob SDK / server mediation
  return null;
}

/** Stub: internal promo ad */
async function fetchInternalAd(_slotKey: string): Promise<ServedAd | null> {
  return null;
}
