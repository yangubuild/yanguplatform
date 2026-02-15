import { supabase } from "@/integrations/supabase/client";

export interface CreatifyParams {
  aspect_ratio?: string;
  duration?: number;
  visual_style?: string;
  script_text?: string;
  template_id?: string;
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

  const res = await fetch(`${supabaseUrl}/functions/v1/creatify-generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ generation_id: generationId }),
  });

  const fnData = await res.json().catch(() => null);

  if (!res.ok || !fnData?.ok) {
    const msg = fnData?.message || fnData?.creatify_body || "Video generation failed";
    console.error("[creatify] Edge function error:", fnData);
    return {
      ok: false,
      generation_id: generationId,
      error: typeof msg === "string" ? msg : JSON.stringify(msg),
    };
  }

  return {
    ok: true,
    generation_id: generationId,
    videos: fnData.videos || [],
  };
}
