/**
 * YANGU useUnlockGate — React hook for gating actions with the unlock system.
 *
 * Usage:
 *   const { attemptAction, UnlockDialog } = useUnlockGate("download_ebook", {
 *     label: "Download Ebook",
 *     onUnlocked: () => performDownload(),
 *   });
 *
 *   <Button onClick={attemptAction}>Download</Button>
 *   {UnlockDialog}
 */

import React, { useState, useCallback, useMemo } from "react";
import { isAlwaysFree, type ActionKey } from "@/lib/ads/unlockMatrix";
import { checkActionEligibility, incrementActionUsage, markFirstFreeUsed } from "@/lib/ads/unlockDecisionEngine";
import { RewardedUnlockDialog } from "@/components/ads/RewardedUnlockDialog";

interface UseUnlockGateOptions {
  label?: string;
  onUnlocked: () => void;
  onUpgradeClick?: () => void;
  onCreditsClick?: () => void;
}

export function useUnlockGate(actionKey: ActionKey, options: UseUnlockGateOptions) {
  const [showDialog, setShowDialog] = useState(false);

  const attemptAction = useCallback(async () => {
    // Fast path for always-free actions
    if (isAlwaysFree(actionKey)) {
      options.onUnlocked();
      return;
    }

    // Quick check: if allowed, just proceed
    const result = await checkActionEligibility(actionKey);
    if (result.decision === "ALLOW") {
      await incrementActionUsage(actionKey);
      if (result.isFirstFree) {
        await markFirstFreeUsed(actionKey);
      }
      options.onUnlocked();
      return;
    }

    // Needs unlock — show dialog
    setShowDialog(true);
  }, [actionKey, options.onUnlocked]);

  const UnlockDialog = useMemo(
    () => (
      <RewardedUnlockDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        actionKey={actionKey}
        actionLabel={options.label}
        onUnlockGranted={options.onUnlocked}
        onUpgradeClick={options.onUpgradeClick}
        onCreditsClick={options.onCreditsClick}
      />
    ),
    [showDialog, actionKey, options.label, options.onUnlocked, options.onUpgradeClick, options.onCreditsClick]
  );

  return { attemptAction, UnlockDialog, showDialog, setShowDialog };
}
