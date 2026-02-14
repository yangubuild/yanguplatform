import { supabase } from "@/integrations/supabase/client";

export interface EntitlementCheckResult {
  allowed: boolean;
  error?: string;
}

/**
 * Attempt to consume an entitlement quota for a given asset type.
 * Returns { allowed: true } on success, or { allowed: false, error } on failure.
 */
export async function consumeEntitlement(
  assetType: string,
  amount: number = 1
): Promise<EntitlementCheckResult> {
  try {
    const { error } = await supabase.rpc("consume_entitlement" as any, {
      p_asset_type: assetType,
      p_amount: amount,
    });

    if (error) {
      const msg = error.message || "";

      // If the entitlement tables don't exist yet, fall back to credits-only mode
      if (msg.includes("does not exist") || msg.includes("relation")) {
        console.warn("[consumeEntitlement] Entitlement tables not set up, falling back to credits-only:", msg);
        return { allowed: true };
      }

      if (
        msg.includes("No active subscription") ||
        msg.includes("Quota exceeded") ||
        msg.includes("No entitlement")
      ) {
        return {
          allowed: false,
          error: "You've reached your monthly limit. Upgrade to continue.",
        };
      }
      return { allowed: false, error: msg };
    }

    return { allowed: true };
  } catch (err) {
    console.error("[consumeEntitlement] Error:", err);
    return {
      allowed: false,
      error: err instanceof Error ? err.message : "Entitlement check failed",
    };
  }
}
