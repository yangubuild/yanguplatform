import { supabase } from "@/integrations/supabase/client";

export interface QwenParams {
  model?: string;
  size?: string;
  style?: string;
  negative_prompt?: string;
}

export interface QwenImage {
  url: string;
  storage_path: string;
  is_image_safe: boolean;
  seed: number;
}

export interface QwenResult {
  ok: boolean;
  generation_id?: string;
  images?: QwenImage[];
  error?: string;
}

/**
 * Create a Qwen image generation, trigger the edge function, and return results.
 */
export async function generateQwenImage(
  prompt: string,
  params: QwenParams = {}
): Promise<QwenResult> {
  // 1. Create generation record via RPC
  const { data: generationId, error: rpcErr } = await supabase.rpc(
    "create_qwen_generation",
    { p_prompt: prompt, p_params: params as unknown as Record<string, string>, p_cost_credits: 1 }
  );

  if (rpcErr || !generationId) {
    console.error("[qwen] RPC error:", rpcErr);
    return { ok: false, error: rpcErr?.message || "Failed to create generation" };
  }

  // 2. Call edge function to process (use fetch to avoid gateway JWT issues)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const session = (await supabase.auth.getSession()).data.session;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/qwen-generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ generation_id: generationId }),
  });

  const fnData = await res.json().catch(() => null);

  if (!res.ok || !fnData?.ok) {
    console.error("[qwen] Edge function error:", fnData);
    return {
      ok: false,
      generation_id: generationId,
      error: fnData?.message || "Image generation failed",
    };
  }

  return {
    ok: true,
    generation_id: generationId,
    images: fnData.images || [],
  };
}
