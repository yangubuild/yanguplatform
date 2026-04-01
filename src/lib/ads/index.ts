/**
 * YANGU Ads & Unlock System — Public API
 */

// Types
export * from "./types";

// Unlock Engine
export { checkUnlockEligibility, isActionAllowed } from "./unlockEngine";

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
