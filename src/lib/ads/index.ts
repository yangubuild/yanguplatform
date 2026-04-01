/**
 * YANGU Ads & Unlock System — Public API
 */

// Types
export * from "./types";

// Unlock Engine (legacy)
export { checkUnlockEligibility, isActionAllowed } from "./unlockEngine";

// Unlock Matrix v1
export {
  ACTION_KEYS,
  UNLOCK_MATRIX,
  shouldShowAd,
  isAlwaysFree,
  requiresSubscription,
  getActionTier,
} from "./unlockMatrix";
export type { ActionKey, UnlockTier, UnlockModule, PlacementType } from "./unlockMatrix";

// Unlock Decision Engine v1
export {
  checkActionEligibility,
  markFirstFreeUsed,
  incrementActionUsage,
  executeWithUnlock,
} from "./unlockDecisionEngine";
export type { UnlockResult } from "./unlockDecisionEngine";

// Ad Events
export {
  recordAdEvent,
  recordAdImpression,
  recordAdStart,
  recordAdCompletion,
  recordAdClick,
  recordAdSkip,
  recordUnlockEvent,
} from "./adEvents";

// Ad Provider
export {
  getAvailableAdForPlacement,
  isAdProviderReady,
  type ServedAd,
} from "./adProvider";

// Advertiser Services
export {
  createAdvertiserAccount,
  getMyAdvertiserAccount,
  submitBusinessKyc,
  reviewBusinessKyc,
  createAdvertiserCampaign,
  submitAdForReview,
  reviewAdCampaign,
} from "./advertiser";
