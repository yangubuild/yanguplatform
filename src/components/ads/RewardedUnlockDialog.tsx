/**
 * YANGU Rewarded Unlock Dialog — Minimal, reusable component.
 * Shows ad unlock flow in a modal when an action is gated.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Loader2, AlertCircle, Gift, CreditCard, Crown } from "lucide-react";
import {
  startUnlockFlow,
  onAdStarted,
  onAdCompleted,
  onAdSkipped,
  type UnlockFlowState,
  type UnlockFlowStatus,
} from "@/lib/ads/rewardedUnlockService";
import type { ActionKey } from "@/lib/ads/unlockMatrix";
import type { ServedAd } from "@/lib/ads/adProvider";

interface RewardedUnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionKey: ActionKey;
  actionLabel?: string;
  onUnlockGranted: () => void;
  onUpgradeClick?: () => void;
  onCreditsClick?: () => void;
}

export function RewardedUnlockDialog({
  open,
  onOpenChange,
  actionKey,
  actionLabel,
  onUnlockGranted,
  onUpgradeClick,
  onCreditsClick,
}: RewardedUnlockDialogProps) {
  const [flowState, setFlowState] = useState<UnlockFlowState | null>(null);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const status = flowState?.status ?? "idle";

  // Start flow when dialog opens
  useEffect(() => {
    if (!open) {
      setFlowState(null);
      setProgress(0);
      setTimeLeft(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    startUnlockFlow(actionKey, {
      onStatusChange: (s) => setFlowState({ ...s }),
      onUnlockGranted: () => {
        onUnlockGranted();
        onOpenChange(false);
      },
    }).then((finalState) => {
      setFlowState({ ...finalState });
    });
  }, [open, actionKey]);

  const handleWatchAd = useCallback(async () => {
    if (!flowState?.servedAd) return;

    const ad = flowState.servedAd;
    const durationMs = ad.duration_seconds * 1000;

    // Start ad
    await onAdStarted(flowState);
    setFlowState((s) => (s ? { ...s, status: "ad_playing" } : null));

    startTimeRef.current = Date.now();
    setTimeLeft(ad.duration_seconds);
    setProgress(0);

    // Progress timer
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / durationMs) * 100, 100);
      const remaining = Math.max(
        Math.ceil((durationMs - elapsed) / 1000),
        0
      );

      setProgress(pct);
      setTimeLeft(remaining);

      if (elapsed >= durationMs) {
        if (timerRef.current) clearInterval(timerRef.current);
        // Complete
        onAdCompleted(flowState, elapsed, {
          onUnlockGranted: () => {
            onUnlockGranted();
            onOpenChange(false);
          },
        });
      }
    }, 100);
  }, [flowState, onUnlockGranted, onOpenChange]);

  const handleSkip = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (flowState) {
      const elapsed = Date.now() - startTimeRef.current;
      await onAdSkipped(flowState, elapsed);
    }
    onOpenChange(false);
  }, [flowState, onOpenChange]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {status === "ad_playing"
              ? "Watching Ad..."
              : status === "unlock_granted"
                ? "Unlocked!"
                : `Unlock ${actionLabel ?? "this feature"}`}
          </DialogTitle>
          {status !== "ad_playing" && status !== "unlock_granted" && (
            <DialogDescription>
              Choose how you'd like to continue
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Loading state */}
          {(status === "checking" || status === "loading_ad") && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Checking access...</p>
            </div>
          )}

          {/* Ad ready — show watch button */}
          {status === "ad_ready" && flowState?.servedAd && (
            <div className="space-y-3">
              {flowState.servedAd.is_test && (
                <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground text-center">
                  🧪 Test Mode — no real ad will play
                </div>
              )}
              <Button
                onClick={handleWatchAd}
                className="w-full gap-2"
                size="lg"
              >
                <Play className="h-4 w-4" />
                Watch a short video ({flowState.servedAd.duration_seconds}s)
              </Button>
              {flowState.options.includes("use_credits") && onCreditsClick && (
                <Button
                  variant="outline"
                  onClick={onCreditsClick}
                  className="w-full gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Use Credits
                </Button>
              )}
              {flowState.options.includes("upgrade_plan") && onUpgradeClick && (
                <Button
                  variant="outline"
                  onClick={onUpgradeClick}
                  className="w-full gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade Plan
                </Button>
              )}
            </div>
          )}

          {/* Ad playing — progress bar */}
          {status === "ad_playing" && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center rounded-lg bg-muted aspect-video">
                {flowState?.servedAd?.is_test ? (
                  <div className="text-center space-y-2">
                    <Gift className="h-10 w-10 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Test Ad Playing</p>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <Play className="h-10 w-10 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Ad Playing</p>
                  </div>
                )}
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground">
                {timeLeft}s remaining
              </p>
            </div>
          )}

          {/* Provider unavailable */}
          {status === "provider_unavailable" && (
            <div className="space-y-3">
              <div className="flex flex-col items-center gap-2 py-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Video ads are not available right now.
                  {flowState?.options?.length
                    ? " You can use another option below."
                    : ""}
                </p>
              </div>
              {onCreditsClick && (
                <Button
                  variant="outline"
                  onClick={onCreditsClick}
                  className="w-full gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Use Credits
                </Button>
              )}
              {onUpgradeClick && (
                <Button
                  variant="outline"
                  onClick={onUpgradeClick}
                  className="w-full gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade Plan
                </Button>
              )}
            </div>
          )}

          {/* Requires credits */}
          {status === "requires_credits" && (
            <div className="space-y-3">
              <div className="flex flex-col items-center gap-2 py-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  This action requires {flowState?.result?.creditsNeeded ?? 1} credit(s).
                </p>
              </div>
              {onCreditsClick && (
                <Button onClick={onCreditsClick} className="w-full gap-2">
                  <CreditCard className="h-4 w-4" />
                  Use Credits
                </Button>
              )}
              {onUpgradeClick && (
                <Button
                  variant="outline"
                  onClick={onUpgradeClick}
                  className="w-full gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade Plan
                </Button>
              )}
            </div>
          )}

          {/* Requires subscription */}
          {status === "requires_subscription" && (
            <div className="space-y-3">
              <div className="flex flex-col items-center gap-2 py-4">
                <Crown className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  This feature requires a subscription.
                </p>
              </div>
              {onUpgradeClick && (
                <Button onClick={onUpgradeClick} className="w-full gap-2">
                  <Crown className="h-4 w-4" />
                  Upgrade Plan
                </Button>
              )}
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="flex flex-col items-center gap-2 py-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground text-center">
                {flowState?.errorMessage ?? "Something went wrong."}
              </p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}
        </div>

        {/* Cancel during ad */}
        {status === "ad_playing" && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-xs text-muted-foreground"
            >
              Skip (won't unlock)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
