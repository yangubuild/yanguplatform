/**
 * YANGU Ad Provider Adapter — Multi-provider with platform-aware routing.
 * Supports: admob_mobile, admanager_web, direct_campaign, internal_test
 * Provider-safe: returns null when no inventory is available instead of throwing.
 */

import { supabase } from "@/integrations/supabase/client";
import type { AdProvider } from "./types";

// ── Extended provider types ────────────────────────────────

export type AdProviderPath =
  | "admob_mobile"
  | "admanager_web"
  | "direct_campaign"
  | "internal_test";

export type AdPlatformContext = "mobile_app" | "web_browser" | "unknown";

export interface ServedAd {
  ad_id: string;
  provider: AdProvider;
  provider_path: AdProviderPath;
  format: string;
  duration_seconds: number;
  media_url: string | null;
  image_url: string | null;
  cta_text: string | null;
  cta_url: string | null;
  campaign_id: string | null;
  is_test: boolean;
}

import { isAdMobAvailable } from "./admobService";

/** Provider readiness flags — flip to true when integration is live */
const PROVIDER_READY: Record<AdProviderPath, boolean> = {
  admob_mobile: isAdMobAvailable(),
  admanager_web: false,
  direct_campaign: false,
  internal_test: true, // always available for QA
};

/** Test mode flag — when true, internal_test provider is preferred */
let _testMode = false;

export function setAdTestMode(enabled: boolean): void {
  _testMode = enabled;
  console.info(`[adProvider] Test mode ${enabled ? "ON" : "OFF"}`);
}

export function isAdTestMode(): boolean {
  return _testMode;
}

export function isAdProviderReady(provider: AdProvider): boolean {
  // Legacy compat: map old provider names
  if (provider === "admob") return PROVIDER_READY.admob_mobile;
  if (provider === "direct") return PROVIDER_READY.direct_campaign;
  if (provider === "internal") return PROVIDER_READY.internal_test;
  return false;
}

export function isAdProviderPathReady(path: AdProviderPath): boolean {
  return PROVIDER_READY[path] === true;
}

// ── Platform detection ─────────────────────────────────────

export function detectPlatformContext(): AdPlatformContext {
  if (typeof window === "undefined") return "unknown";

  // Capacitor native app detection
  const isCapacitor =
    !!(window as any).Capacitor?.isNativePlatform?.() ||
    !!(window as any).Capacitor?.isPluginAvailable;

  if (isCapacitor) return "mobile_app";

  return "web_browser";
}

function getPreferredProviderPath(platform: AdPlatformContext): AdProviderPath {
  if (_testMode) return "internal_test";

  // Direct campaigns always get priority if ready
  if (PROVIDER_READY.direct_campaign) return "direct_campaign";

  switch (platform) {
    case "mobile_app":
      return PROVIDER_READY.admob_mobile ? "admob_mobile" : "internal_test";
    case "web_browser":
      return PROVIDER_READY.admanager_web ? "admanager_web" : "internal_test";
    default:
      return "internal_test";
  }
}

// ── Main API ───────────────────────────────────────────────

export interface AdRequestContext {
  slotKey: string;
  actionKey?: string;
  platform?: AdPlatformContext;
  preferredDuration?: number;
}

/**
 * Get an available ad for a given placement context.
 * Routes to the correct provider based on platform + readiness.
 * Returns null if nothing is available (provider-safe).
 */
export async function getAvailableAdForPlacement(
  slotKeyOrCtx: string | AdRequestContext
): Promise<ServedAd | null> {
  const ctx: AdRequestContext =
    typeof slotKeyOrCtx === "string"
      ? { slotKey: slotKeyOrCtx }
      : slotKeyOrCtx;

  const platform = ctx.platform ?? detectPlatformContext();
  const providerPath = getPreferredProviderPath(platform);

  // Try preferred path first
  const ad = await fetchAdFromPath(providerPath, ctx);
  if (ad) return ad;

  // Fallback chain: direct → network → test
  const fallbackChain: AdProviderPath[] =
    platform === "mobile_app"
      ? ["direct_campaign", "admob_mobile", "internal_test"]
      : ["direct_campaign", "admanager_web", "internal_test"];

  for (const path of fallbackChain) {
    if (path === providerPath) continue; // already tried
    if (!PROVIDER_READY[path]) continue;
    const fallbackAd = await fetchAdFromPath(path, ctx);
    if (fallbackAd) return fallbackAd;
  }

  return null;
}

/**
 * Get provider availability status for UI display.
 */
export function getProviderStatus(): Record<AdProviderPath, boolean> {
  return { ...PROVIDER_READY };
}

// ── Provider-specific fetchers ─────────────────────────────

async function fetchAdFromPath(
  path: AdProviderPath,
  ctx: AdRequestContext
): Promise<ServedAd | null> {
  switch (path) {
    case "direct_campaign":
      return fetchDirectAd(ctx);
    case "admob_mobile":
      return fetchAdMobAd(ctx);
    case "admanager_web":
      return fetchAdManagerWebAd(ctx);
    case "internal_test":
      return fetchInternalTestAd(ctx);
    default:
      return null;
  }
}

/** Fetch a direct advertiser campaign ad from DB */
async function fetchDirectAd(ctx: AdRequestContext): Promise<ServedAd | null> {
  try {
    const { data } = await supabase
      .from("ads")
      .select(
        "id, image_url, video_url, cta_text, cta_url, duration_seconds, advertiser_id"
      )
      .eq("status", "active")
      .eq("provider", "direct")
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    return {
      ad_id: data.id,
      provider: "direct",
      provider_path: "direct_campaign",
      format: data.video_url ? "rewarded_video" : "image",
      duration_seconds: data.duration_seconds ?? 15,
      media_url: data.video_url ?? null,
      image_url: data.image_url ?? null,
      cta_text: data.cta_text ?? null,
      cta_url: data.cta_url ?? null,
      campaign_id: null,
      is_test: false,
    };
  } catch {
    return null;
  }
}

/** Stub: AdMob SDK adapter for mobile — to be wired with real SDK */
async function fetchAdMobAd(
  _ctx: AdRequestContext
): Promise<ServedAd | null> {
  // Will integrate with Capacitor AdMob plugin
  return null;
}

/** Stub: Google Ad Manager / web rewarded ad adapter */
async function fetchAdManagerWebAd(
  _ctx: AdRequestContext
): Promise<ServedAd | null> {
  // Will integrate with Google Publisher Tag / Interactive Media Ads SDK
  return null;
}

/** Internal test provider — deterministic ad for QA */
async function fetchInternalTestAd(
  ctx: AdRequestContext
): Promise<ServedAd | null> {
  const duration = ctx.preferredDuration ?? 10;
  return {
    ad_id: `test_ad_${Date.now()}`,
    provider: "internal",
    provider_path: "internal_test",
    format: "rewarded_video",
    duration_seconds: Math.min(duration, 20),
    media_url: null,
    image_url: null,
    cta_text: "Learn More (Test)",
    cta_url: null,
    campaign_id: null,
    is_test: true,
  };
}
