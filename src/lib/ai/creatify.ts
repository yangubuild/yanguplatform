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

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 120; // 10 minutes max

/**
 * Create a Creatify video generation, submit to provider, then poll for completion.
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

  // 2. Submit to provider (returns immediately)
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

  const submitRes = await fetch(`${supabaseUrl}/functions/v1/creatify-generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ generation_id: generationId }),
  });

  const submitData = await submitRes.json().catch(() => null);

  if (!submitRes.ok || !submitData?.ok) {
    const msg = submitData?.message || submitData?.creatify_body || "Video generation failed";
    console.error("[creatify] Submit error:", submitData);
    return {
      ok: false,
      generation_id: generationId,
      error: typeof msg === "string" ? msg : JSON.stringify(msg),
    };
  }

  // 3. Poll check-status until done/failed
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

    const statusRes = await fetch(`${supabaseUrl}/functions/v1/creatify-generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "check-status", generation_id: generationId }),
    });

    const statusData = await statusRes.json().catch(() => null);

    if (statusData?.status === "done") {
      return {
        ok: true,
        generation_id: generationId,
        videos: statusData.videos || [],
      };
    }

    if (statusData?.status === "failed" || (statusRes.ok === false && statusData?.error)) {
      return {
        ok: false,
        generation_id: generationId,
        error: statusData?.error || "Video generation failed",
      };
    }

    // Still processing, continue polling
  }

  return {
    ok: false,
    generation_id: generationId,
    error: "Video generation timed out",
  };
}
