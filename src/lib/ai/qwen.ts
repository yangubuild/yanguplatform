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
    { p_prompt: prompt, p_params: params as unknown as Record<string, string> }
  );

  if (rpcErr || !generationId) {
    console.error("[qwen] RPC error:", rpcErr);
    return { ok: false, error: rpcErr?.message || "Failed to create generation" };
  }

  // 2. Call edge function to process
  const { data: fnData, error: fnErr } = await supabase.functions.invoke(
    "qwen-generate",
    { body: { generation_id: generationId } }
  );

  if (fnErr) {
    console.error("[qwen] Edge function error:", fnErr);
    return { ok: false, generation_id: generationId, error: "Image generation failed" };
  }

  if (!fnData?.ok) {
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
