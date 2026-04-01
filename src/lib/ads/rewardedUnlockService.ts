/**
 * YANGU Rewarded Unlock Service — Orchestrates the full ad-to-unlock flow.
 *
 * 1. Checks eligibility via unlock decision engine
 * 2. If FLEX_UNLOCK with watch_ad option, fetches ad from provider
 * 3. Manages ad session lifecycle (impression → start → completion)
 * 4. Grants unlock only after valid completion
 * 5. Records all events for analytics
 */

import { checkActionEligibility, incrementActionUsage, markFirstFreeUsed } from "./unlockDecisionEngine";
import { getAvailableAdForPlacement, type ServedAd, type AdPlatformContext, detectPlatformContext, isAdTestMode } from "./adProvider";
import { showRewardedAd as showAdMobRewarded, isAdMobAvailable } from "./admobService";
import { recordAdImpression, recordAdStart, recordAdCompletion, recordAdSkip, recordUnlockEvent } from "./adEvents";
import { UNLOCK_MATRIX, shouldShowAd, type ActionKey } from "./unlockMatrix";
import type { UnlockResult } from "./unlockDecisionEngine";

// ── Types ──────────────────────────────────────────────────

export type UnlockFlowStatus =
  | "idle"
  | "checking"
  | "allowed"
  | "loading_ad"
  | "ad_ready"
  | "ad_playing"
  | "ad_completed"
  | "unlock_granted"
  | "provider_unavailable"
  | "requires_credits"
  | "requires_subscription"
  | "error";

export interface UnlockFlowState {
  status: UnlockFlowStatus;
  actionKey: ActionKey;
  result: UnlockResult | null;
  servedAd: ServedAd | null;
  options: string[];
  errorMessage?: string;
}

export interface UnlockFlowCallbacks {
  onStatusChange?: (state: UnlockFlowState) => void;
  onUnlockGranted?: () => void;
  onAdRequired?: (ad: ServedAd) => void;
  onProviderUnavailable?: (options: string[]) => void;
  onRequiresCredits?: (amount: number) => void;
  onRequiresSubscription?: () => void;
}

// ── Session tracking ───────────────────────────────────────

let _sessionAdCount = 0;
const MAX_ADS_PER_SESSION = 20; // configurable cap

export function getSessionAdCount(): number {
  return _sessionAdCount;
}

export function resetSessionAdCount(): void {
  _sessionAdCount = 0;
}

// ── Core flow ──────────────────────────────────────────────

/**
 * Execute the full unlock check flow for an action.
 * Returns the flow state so the caller can decide what UI to show.
 */
export async function startUnlockFlow(
  actionKey: ActionKey,
  callbacks?: UnlockFlowCallbacks
): Promise<UnlockFlowState> {
  const state: UnlockFlowState = {
    status: "checking",
    actionKey,
    result: null,
    servedAd: null,
    options: [],
  };

  callbacks?.onStatusChange?.(state);

  try {
    // Step 1: Check eligibility
    const result = await checkActionEligibility(actionKey);
    state.result = result;

    // Step 2: Handle decision
    if (result.decision === "ALLOW") {
      state.status = "allowed";
      callbacks?.onStatusChange?.(state);

      // Track usage
      await incrementActionUsage(actionKey);
      if (result.isFirstFree) {
        await markFirstFreeUsed(actionKey);
      }

      callbacks?.onUnlockGranted?.();
      state.status = "unlock_granted";
      callbacks?.onStatusChange?.(state);
      return state;
    }

    // Parse options from decision engine
    state.options = result.options ?? [];

    // Step 3: Handle FLEX_UNLOCK / REQUIRE_AD
    if (
      (result.decision === "REQUIRE_AD" || result.decision === "FIRST_FREE") ||
      (state.options.includes("watch_ad") && canShowAd(actionKey))
    ) {
      return await attemptAdUnlock(actionKey, state, callbacks);
    }

    // Step 4: Handle credits
    if (result.decision === "REQUIRE_CREDITS" || state.options.includes("use_credits")) {
      state.status = "requires_credits";
      callbacks?.onStatusChange?.(state);
      callbacks?.onRequiresCredits?.(result.creditsNeeded ?? 1);
      return state;
    }

    // Step 5: Handle subscription
    if (result.decision === "REQUIRE_PAYMENT" || result.decision === "PLAN_LIMIT_EXCEEDED") {
      state.status = "requires_subscription";
      callbacks?.onStatusChange?.(state);
      callbacks?.onRequiresSubscription?.();
      return state;
    }

    // Fallback: allow with warning
    console.warn("[rewardedUnlock] Unhandled decision, allowing:", result.decision);
    state.status = "allowed";
    callbacks?.onStatusChange?.(state);
    callbacks?.onUnlockGranted?.();
    return state;
  } catch (err) {
    console.error("[rewardedUnlock] Flow error:", err);
    state.status = "error";
    state.errorMessage = "Something went wrong. Please try again.";
    callbacks?.onStatusChange?.(state);
    return state;
  }
}

function canShowAd(actionKey: ActionKey): boolean {
  const entry = UNLOCK_MATRIX[actionKey];
  if (!entry?.adAllowed) return false;
  if (_sessionAdCount >= MAX_ADS_PER_SESSION) return false;
  return true;
}

async function attemptAdUnlock(
  actionKey: ActionKey,
  state: UnlockFlowState,
  callbacks?: UnlockFlowCallbacks
): Promise<UnlockFlowState> {
  state.status = "loading_ad";
  callbacks?.onStatusChange?.(state);

  const entry = UNLOCK_MATRIX[actionKey];
  const placement = entry?.placement ?? "modal_unlock";

  const ad = await getAvailableAdForPlacement({
    slotKey: placement,
    actionKey,
  });

  if (!ad) {
    state.status = "provider_unavailable";
    // Offer alternative options
    const fallbackOptions = state.options.filter((o) => o !== "watch_ad");
    if (fallbackOptions.length === 0) fallbackOptions.push("upgrade_plan");
    state.options = fallbackOptions;
    callbacks?.onStatusChange?.(state);
    callbacks?.onProviderUnavailable?.(fallbackOptions);
    return state;
  }

  state.servedAd = ad;
  state.status = "ad_ready";
  callbacks?.onStatusChange?.(state);

  // If AdMob mobile, auto-trigger native rewarded flow
  if (ad.provider_path === "admob_mobile" && isAdMobAvailable()) {
    state.status = "ad_playing";
    callbacks?.onStatusChange?.(state);

    const startTime = Date.now();
    await onAdStarted(state);
    const result = await showAdMobRewarded();
    const watchMs = Date.now() - startTime;

    if (result.status === "completed") {
      return await onAdCompleted(state, watchMs, callbacks);
    } else {
      await onAdSkipped(state, watchMs);
      if (result.status === "dismissed") {
        state.status = "idle";
      } else {
        state.status = "error";
        state.errorMessage = result.error ?? "Ad failed to load";
      }
      callbacks?.onStatusChange?.(state);
      return state;
    }
  }

  callbacks?.onAdRequired?.(ad);

  return state;
}

/**
 * Call when ad starts playing (user initiated or auto-play).
 */
export async function onAdStarted(state: UnlockFlowState): Promise<void> {
  if (!state.servedAd) return;
  state.status = "ad_playing";

  const source = state.servedAd.is_test ? "test" : state.servedAd.provider;

  await recordAdImpression({
    ad_id: state.servedAd.ad_id,
    placement_slot: UNLOCK_MATRIX[state.actionKey]?.placement,
    provider: source,
    campaign_id: state.servedAd.campaign_id ?? undefined,
  });

  await recordAdStart({
    ad_id: state.servedAd.ad_id,
    placement_slot: UNLOCK_MATRIX[state.actionKey]?.placement,
    provider: source,
    campaign_id: state.servedAd.campaign_id ?? undefined,
  });
}

/**
 * Call when ad completes successfully. Grants unlock.
 */
export async function onAdCompleted(
  state: UnlockFlowState,
  watchDurationMs: number,
  callbacks?: UnlockFlowCallbacks
): Promise<UnlockFlowState> {
  if (!state.servedAd) {
    state.status = "error";
    state.errorMessage = "No ad session to complete.";
    return state;
  }

  const source = state.servedAd.is_test ? "test" : state.servedAd.provider;
  const placement = UNLOCK_MATRIX[state.actionKey]?.placement;

  // Record completion
  await recordAdCompletion({
    ad_id: state.servedAd.ad_id,
    placement_slot: placement,
    provider: source,
    campaign_id: state.servedAd.campaign_id ?? undefined,
    watch_duration_ms: watchDurationMs,
  });

  // Record unlock event
  await recordUnlockEvent({
    ad_id: state.servedAd.ad_id,
    placement_slot: placement,
    provider: source,
    campaign_id: state.servedAd.campaign_id ?? undefined,
  });

  // Increment usage and session count
  await incrementActionUsage(state.actionKey);
  _sessionAdCount++;

  state.status = "unlock_granted";
  callbacks?.onStatusChange?.(state);
  callbacks?.onUnlockGranted?.();

  return state;
}

/**
 * Call when user skips/abandons the ad. Does NOT grant unlock.
 */
export async function onAdSkipped(
  state: UnlockFlowState,
  watchDurationMs: number
): Promise<void> {
  if (!state.servedAd) return;

  const source = state.servedAd.is_test ? "test" : state.servedAd.provider;

  await recordAdSkip({
    ad_id: state.servedAd.ad_id,
    placement_slot: UNLOCK_MATRIX[state.actionKey]?.placement,
    provider: source,
    campaign_id: state.servedAd.campaign_id ?? undefined,
    watch_duration_ms: watchDurationMs,
  });

  state.status = "idle";
}
