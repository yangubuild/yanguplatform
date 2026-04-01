/**
 * YANGU Unlock Decision Engine — Client-side orchestrator
 *
 * Calls the DB RPC for authoritative decisions,
 * provides helpers for marking first-free and incrementing usage.
 */

import { supabase } from "@/integrations/supabase/client";
import { UNLOCK_MATRIX, type ActionKey } from "./unlockMatrix";
import type { UnlockEligibility } from "./types";

export interface UnlockResult {
  decision: string;
  reason?: string;
  ruleId?: string;
  creditsNeeded?: number;
  timeUnlockMinutes?: number;
  options?: string[];
  isFirstFree?: boolean;
  used?: number;
  limit?: number;
}

/**
 * Full 5-step decision check via RPC.
 * Falls back to client-side hints if RPC unavailable.
 */
export async function checkActionEligibility(
  actionKey: ActionKey
): Promise<UnlockResult> {
  // Quick client-side check for always-free actions
  const entry = UNLOCK_MATRIX[actionKey];
  if (entry?.tier === "FREE") {
    return { decision: "ALLOW", reason: "always_free" };
  }

  try {
    const { data, error } = await supabase.rpc(
      "check_unlock_eligibility" as any,
      { p_action_key: actionKey }
    );

    if (error) {
      const msg = error.message || "";
      if (msg.includes("does not exist") || msg.includes("relation")) {
        console.warn("[unlockDecision] RPC not found, allowing by default");
        return { decision: "ALLOW", reason: "rpc_not_found" };
      }
      console.error("[unlockDecision] Error:", msg);
      return { decision: "ALLOW", reason: "error_fallback" };
    }

    const result = typeof data === "string" ? JSON.parse(data) : data;

    return {
      decision: result?.decision ?? "ALLOW",
      reason: result?.reason,
      ruleId: result?.rule_id,
      creditsNeeded: result?.credits_needed,
      timeUnlockMinutes: result?.time_unlock_minutes,
      options: result?.options,
      isFirstFree: result?.is_first_free,
      used: result?.used,
      limit: result?.limit,
    };
  } catch (err) {
    console.error("[unlockDecision] Unexpected error:", err);
    return { decision: "ALLOW", reason: "catch_fallback" };
  }
}

/**
 * Mark a FIRST_FREE action as used (call after first successful completion).
 */
export async function markFirstFreeUsed(actionKey: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("mark_first_free_used" as any, {
      p_action_key: actionKey,
    });
    if (error) {
      console.error("[unlockDecision] markFirstFreeUsed error:", error.message);
      return false;
    }
    return data === true;
  } catch {
    return false;
  }
}

/**
 * Increment usage counter for an action (call after each successful action).
 * Returns the new count.
 */
export async function incrementActionUsage(
  actionKey: string
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc(
      "increment_action_usage" as any,
      { p_action_key: actionKey }
    );
    if (error) {
      console.error("[unlockDecision] incrementUsage error:", error.message);
      return -1;
    }
    return typeof data === "number" ? data : 0;
  } catch {
    return -1;
  }
}

/**
 * Convenience: perform an action with full unlock flow.
 * Returns { allowed, result } where result contains decision details.
 */
export async function executeWithUnlock(
  actionKey: ActionKey
): Promise<{ allowed: boolean; result: UnlockResult }> {
  const result = await checkActionEligibility(actionKey);

  if (result.decision === "ALLOW") {
    // Track usage
    await incrementActionUsage(actionKey);

    // Mark first-free if applicable
    if (result.isFirstFree) {
      await markFirstFreeUsed(actionKey);
    }

    return { allowed: true, result };
  }

  return { allowed: false, result };
}
