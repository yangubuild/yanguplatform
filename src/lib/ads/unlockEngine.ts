/**
 * YANGU Unlock Engine — central decision layer for gating platform actions.
 */

import { supabase } from "@/integrations/supabase/client";
import type { UnlockEligibility } from "./types";

/**
 * Check whether the current user can perform a given action.
 * Returns a decision: ALLOW, REQUIRE_AD, REQUIRE_CREDITS, REQUIRE_PAYMENT, etc.
 */
export async function checkUnlockEligibility(
  actionKey: string
): Promise<UnlockEligibility> {
  try {
    const { data, error } = await supabase.rpc(
      "check_unlock_eligibility" as any,
      { p_action_key: actionKey }
    );

    if (error) {
      const msg = error.message || "";
      // If RPC doesn't exist yet, allow by default
      if (msg.includes("does not exist") || msg.includes("relation")) {
        console.warn("[unlockEngine] RPC not found, allowing by default");
        return { decision: "ALLOW", reason: "rpc_not_found" };
      }
      console.error("[unlockEngine] Error:", msg);
      return { decision: "ALLOW", reason: "error_fallback" };
    }

    const result =
      typeof data === "string" ? JSON.parse(data) : (data as UnlockEligibility);

    return {
      decision: result?.decision ?? "ALLOW",
      reason: result?.reason,
      rule_id: result?.rule_id,
      credits_needed: result?.credits_needed,
    };
  } catch (err) {
    console.error("[unlockEngine] Unexpected error:", err);
    return { decision: "ALLOW", reason: "catch_fallback" };
  }
}

/**
 * Convenience: returns true if action is allowed without any gate.
 */
export async function isActionAllowed(actionKey: string): Promise<boolean> {
  const result = await checkUnlockEligibility(actionKey);
  return result.decision === "ALLOW";
}
