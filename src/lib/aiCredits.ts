import { supabase } from "@/integrations/supabase/client";

export interface AiCreditResult {
  allowed: boolean;
  remaining: number;
  reason?: string;
}

/**
 * Consume an AI credit via the new billing RPCs.
 * Falls back to allowed=true if the RPC doesn't exist yet.
 */
async function consumeCredit(rpcName: string): Promise<AiCreditResult> {
  try {
    const { data, error } = await supabase.rpc(rpcName as any);
    if (error) {
      const msg = error.message || "";
      if (msg.includes("does not exist") || msg.includes("relation")) {
        console.warn(`[aiCredits] ${rpcName} not found, allowing by default`);
        return { allowed: true, remaining: 999 };
      }
      return { allowed: false, remaining: 0, reason: msg };
    }
    const result = typeof data === "string" ? JSON.parse(data) : data;
    return {
      allowed: result?.allowed ?? false,
      remaining: result?.remaining ?? 0,
      reason: result?.reason,
    };
  } catch (err) {
    console.error(`[aiCredits] ${rpcName} error:`, err);
    return { allowed: false, remaining: 0, reason: "Credit check failed" };
  }
}

export const consumeAiImageCredit = () => consumeCredit("consume_ai_image_credit");
export const consumeAiVideoCredit = () => consumeCredit("consume_ai_video_credit");
export const consumeAiAvatarCredit = () => consumeCredit("consume_ai_avatar_credit");
