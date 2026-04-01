/**
 * YANGU AdMob Rewarded Ad Service — Capacitor native only.
 * Uses @capacitor-community/admob for rewarded video ads.
 * Always starts in test mode. Production ads require flipping the flag.
 */

import { Capacitor } from "@capacitor/core";

// ── Config ─────────────────────────────────────────────────

/** Replace with real ad unit IDs when going live */
const ADMOB_CONFIG = {
  /** Android rewarded ad unit — test ID by default */
  REWARDED_ANDROID: "ca-app-pub-3940256099942544/5224354917",
  /** iOS rewarded ad unit — test ID by default */
  REWARDED_IOS: "ca-app-pub-3940256099942544/1712485313",
  /** Set to false to use production ad unit IDs */
  USE_TEST_ADS: true,
};

export type AdMobRewardResult = {
  status: "completed" | "dismissed" | "failed";
  rewardType?: string;
  rewardAmount?: number;
  error?: string;
};

let _initialized = false;

// ── Helpers ────────────────────────────────────────────────

function getRewardedAdUnitId(): string {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") return ADMOB_CONFIG.REWARDED_IOS;
  return ADMOB_CONFIG.REWARDED_ANDROID;
}

export function isAdMobAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

// ── Core ───────────────────────────────────────────────────

async function ensureInitialized(): Promise<boolean> {
  if (!isAdMobAvailable()) return false;
  if (_initialized) return true;

  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.initialize({
      initializeForTesting: ADMOB_CONFIG.USE_TEST_ADS,
    });
    _initialized = true;
    console.info("[admobService] AdMob initialized (test mode:", ADMOB_CONFIG.USE_TEST_ADS, ")");
    return true;
  } catch (err) {
    console.error("[admobService] Failed to initialize AdMob:", err);
    return false;
  }
}

/**
 * Load and show a rewarded ad. Returns result after user interaction.
 * Only works on Capacitor native platforms.
 */
export async function showRewardedAd(
  adUnitId?: string
): Promise<AdMobRewardResult> {
  if (!isAdMobAvailable()) {
    return { status: "failed", error: "Not a native platform" };
  }

  const ready = await ensureInitialized();
  if (!ready) {
    return { status: "failed", error: "AdMob initialization failed" };
  }

  const unitId = adUnitId ?? getRewardedAdUnitId();

  try {
    const { AdMob, RewardAdPluginEvents } = await import(
      "@capacitor-community/admob"
    );

    return new Promise<AdMobRewardResult>(async (resolve) => {
      let settled = false;
      const handles: { remove: () => void }[] = [];

      const settle = (result: AdMobRewardResult) => {
        if (settled) return;
        settled = true;
        handles.forEach((h) => h.remove());
        resolve(result);
      };

      // Listen for reward earned
      handles.push(
        await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
          console.info("[admobService] Reward earned:", reward);
          settle({
            status: "completed",
            rewardType: reward?.type ?? undefined,
            rewardAmount: reward?.amount ?? undefined,
          });
        })
      );

      // Listen for dismissal without reward
      handles.push(
        await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          console.info("[admobService] Ad dismissed");
          settle({ status: "dismissed" });
        })
      );

      // Listen for failure to show
      handles.push(
        await AdMob.addListener(RewardAdPluginEvents.FailedToShow, (err) => {
          console.warn("[admobService] Ad failed to show:", err);
          settle({
            status: "failed",
            error: err?.message ?? "Failed to show ad",
          });
        })
      );

      // Load + show
      try {
        await AdMob.prepareRewardVideoAd({ adId: unitId, isTesting: ADMOB_CONFIG.USE_TEST_ADS });
        await AdMob.showRewardVideoAd();
      } catch (err: any) {
        console.error("[admobService] Load/show error:", err);
        settle({
          status: "failed",
          error: err?.message ?? "Ad load failed",
        });
      }
    });
  } catch (err: any) {
    console.error("[admobService] Unexpected error:", err);
    return { status: "failed", error: err?.message ?? "Unknown error" };
  }
}
