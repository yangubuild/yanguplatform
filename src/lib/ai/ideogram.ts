import { supabase } from "@/integrations/supabase/client";

export interface IdeogramParams {
  model?: string;
  aspect_ratio?: string;
  style_type?: string;
  magic_prompt_option?: string;
  negative_prompt?: string;
}

export interface IdeogramImage {
  url: string;
  storage_path: string;
  is_image_safe: boolean;
  seed: number;
}

export interface IdeogramResult {
  ok: boolean;
  generation_id?: string;
  images?: IdeogramImage[];
  error?: string;
}

/**
 * Create an Ideogram generation, trigger the edge function, and return results.
 */
export async function generateIdeogramImage(
  prompt: string,
  params: IdeogramParams = {}
): Promise<IdeogramResult> {
  // 1. Create generation record via RPC
  const { data: generationId, error: rpcErr } = await supabase.rpc(
    "create_ideogram_generation",
    { p_prompt: prompt, p_params: params as unknown as Record<string, string> }
  );

  if (rpcErr || !generationId) {
    console.error("[ideogram] RPC error:", rpcErr);
    return { ok: false, error: rpcErr?.message || "Failed to create generation" };
  }

  // 2. Call edge function to process
  const { data: fnData, error: fnErr } = await supabase.functions.invoke(
    "ideogram-generate",
    { body: { generation_id: generationId } }
  );

  if (fnErr) {
    console.error("[ideogram] Edge function error:", fnErr);
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
