/**
 * YANGU — Provider Readiness Layer
 * Controls whether each social network is ready for real OAuth/publishing.
 * When Outstand managed keys are enabled, flip the flag — everything activates automatically.
 */

import type { SocialProvider } from "@/types/socialMedia";

// ── Master readiness map ─────────────────────────────────
// Set to `true` once provider credentials are configured.
// This is the single switch — no other code changes needed.
const PROVIDER_READY: Record<string, boolean> = {
  facebook: false,
  instagram: false,
  instagram_story: false,
  x: false,
  linkedin_company: false,
  linkedin_personal: false,
  tiktok: false,
  youtube: false,
  threads: false,
  pinterest: false,
  snapchat: false,
};

export function isProviderReady(provider: SocialProvider | string): boolean {
  return PROVIDER_READY[provider] === true;
}

export function getProviderStatus(provider: SocialProvider | string): "ready" | "coming_soon" {
  return isProviderReady(provider) ? "ready" : "coming_soon";
}

export function getAllProviderStatuses(): Record<string, "ready" | "coming_soon"> {
  const result: Record<string, "ready" | "coming_soon"> = {};
  for (const [key] of Object.entries(PROVIDER_READY)) {
    result[key] = getProviderStatus(key);
  }
  return result;
}
