import { supabase } from "@/integrations/supabase/client";

export interface CreatifyParams {
  aspect_ratio?: string;
  duration?: number;
  visual_style?: string;
  script_text?: string;
}

export interface CreatifyVideo {
  url: string;
  storage_path: string;
  thumbnail_url?: string | null;
  thumbnail_storage_path?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CreatifyResult {
  ok: boolean;
  generation_id?: string;
  videos?: CreatifyVideo[];
  error?: string;
}

/**
 * Create a Creatify video generation, trigger the edge function, and return results.
 * The prompt can be a product URL (for URL-to-video) or text description.
 */
export async function generateCreatifyVideo(
  prompt: string,
  params: CreatifyParams = {}
): Promise<CreatifyResult> {
  // 1. Create generation record via RPC
  const { data: generationId, error: rpcErr } = await supabase.rpc(
    "create_creatify_generation" as any,
    { p_prompt: prompt, p_params: params as unknown as Record<string, string> }
  );

  if (rpcErr || !generationId) {
    console.error("[creatify] RPC error:", rpcErr);
    return { ok: false, error: rpcErr?.message || "Failed to create generation" };
  }

  // 2. Call edge function to process (this may take several minutes)
  const { data: fnData, error: fnErr } = await supabase.functions.invoke(
    "creatify-generate",
    { body: { generation_id: generationId } }
  );

  if (fnErr) {
    console.error("[creatify] Edge function error:", fnErr);
    return { ok: false, generation_id: generationId, error: "Video generation failed" };
  }

  if (!fnData?.ok) {
    return {
      ok: false,
      generation_id: generationId,
      error: fnData?.message || "Video generation failed",
    };
  }

  return {
    ok: true,
    generation_id: generationId,
    videos: fnData.videos || [],
  };
}
