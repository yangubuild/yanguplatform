import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function logPayload(endpoint: string, payload: unknown) {
  console.log(`[creatify-generate] → ${endpoint}`, JSON.stringify(payload));
}

async function creatifyError(res: Response, endpoint: string) {
  const rawText = await res.text();
  let creatifyBody: unknown = rawText;
  try { creatifyBody = JSON.parse(rawText); } catch (_) { /* keep as string */ }
  const detail = {
    ok: false,
    error_code: "CREATIFY_ERROR",
    message: `Creatify ${res.status} from ${endpoint}`,
    creatify_status: res.status,
    creatify_body: creatifyBody,
    endpoint,
  };
  console.error("[creatify-generate] ✗ upstream error", JSON.stringify(detail));
  return detail;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ ok: false, error_code: "AUTH_REQUIRED", message: "Authentication required" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const creatifyApiId = Deno.env.get("CREATIFY_API_ID");
    const creatifyApiKey = Deno.env.get("CREATIFY_API_KEY");

    if (!creatifyApiId || !creatifyApiKey) {
      return json({ ok: false, error_code: "PROVIDER_NOT_CONFIGURED", message: "Creatify API credentials not configured" }, 500);
    }

    // Verify user via getClaims (compatible with signing-keys)
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ ok: false, error_code: "AUTH_INVALID", message: "Invalid auth token" }, 401);
    const user = { id: claimsData.claims.sub as string };

    const body = await req.json();
    const action = body.action || "generate";
    const useSSE = body.stream === true;

    const creatifyHeaders = {
      "Content-Type": "application/json",
      "X-API-ID": creatifyApiId,
      "X-API-KEY": creatifyApiKey,
    };

    const admin = createClient(supabaseUrl, serviceKey);

    // ──────────────────────────────────────────────
    // ACTION: list-templates (no SSE needed)
    // ──────────────────────────────────────────────
    if (action === "list-templates") {
      console.log("[creatify-generate] Fetching templates from Creatify API");

      let allTemplates: Record<string, unknown>[] = [];
      let nextUrl: string | null = "https://api.creatify.ai/api/custom_templates/";

      while (nextUrl) {
        const res = await fetch(nextUrl, { headers: creatifyHeaders });
        if (!res.ok) {
          const errDetail = await creatifyError(res, nextUrl);
          return json(errDetail, 502);
        }
        const body = await res.json();
        const page = Array.isArray(body) ? body : (body.results || []);
        allTemplates = allTemplates.concat(page);
        nextUrl = (!Array.isArray(body) && body.next) ? String(body.next) : null;
      }

      if (allTemplates.length === 0) {
        return json({ ok: true, templates: [], count: 0, reason: "no_templates_in_account", message: "No custom templates found." });
      }

      const rows = allTemplates.map((t) => ({
        id: String(t.template_id || t.id),
        name: String(t.name || t.title || "Untitled"),
        preview_url: (t.preview || t.preview_url || t.thumbnail || null) as string | null,
        aspect_ratio: (t.aspect_ratio || null) as string | null,
        metadata: JSON.stringify({ raw_keys: Object.keys(t) }),
        fetched_at: new Date().toISOString(),
      }));

      const { error: upsertErr } = await admin
        .from("creatify_templates")
        .upsert(rows, { onConflict: "id", count: "exact" });

      if (upsertErr) console.warn("[creatify-generate] Template cache upsert error:", upsertErr.message);

      return json({ ok: true, templates: rows.map(r => ({ id: r.id, name: r.name, preview_url: r.preview_url, aspect_ratio: r.aspect_ratio })), count: rows.length });
    }

    // ──────────────────────────────────────────────
    // ACTION: generate (default / legacy)
    // ──────────────────────────────────────────────
    const { generation_id } = body;
    if (!generation_id) return json({ ok: false, error_code: "BAD_REQUEST", message: "generation_id is required" }, 400);

    const { data: gen, error: genErr } = await admin
      .from("ai_video_generations")
      .select("*")
      .eq("id", generation_id)
      .single();

    if (genErr || !gen) return json({ ok: false, error_code: "NOT_FOUND", message: "Generation not found" }, 404);
    if (gen.user_id !== user.id) return json({ ok: false, error_code: "FORBIDDEN", message: "Not your generation" }, 403);
    if (gen.status !== "queued") return json({ ok: false, error_code: "ALREADY_PROCESSING", message: `Status is already ${gen.status}` }, 409);

    await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "processing" });

    const genParams = gen.params as Record<string, unknown> || {};
    const costCredits = genParams.cost_credits ? Number(genParams.cost_credits) : 0;

    const refundIfNeeded = async (note: string) => {
      if (costCredits > 0) {
        try { await admin.rpc("refund_credits", { p_amount: costCredits, p_ref_type: "video", p_ref_id: generation_id, p_note: note }); } catch (_) {}
      }
    };

    if (!gen.prompt || !gen.prompt.trim()) {
      await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: "Product link is required" });
      await refundIfNeeded("Empty product link");
      return json({ ok: false, error_code: "VALIDATION_ERROR", message: "Product link is required." }, 400);
    }

    // SSE mode: stream progress events
    if (useSSE) {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const emit = (data: unknown) => {
            try { controller.enqueue(encoder.encode(sseEvent(data))); } catch (_) {}
          };

          try {
            emit({ type: "generation_status", status: "queued", generation_id });

            const result = await runCreatifyGeneration(gen, genParams, user, admin, creatifyHeaders, generation_id, costCredits, refundIfNeeded, emit);

            if (!result.ok) {
              emit({ type: "generation_status", status: "error", error: result.error || "Video generation failed" });
            }
          } catch (err) {
            console.error("[creatify-generate] SSE error:", err);
            emit({ type: "generation_status", status: "error", error: err instanceof Error ? err.message : "Unknown error" });
          } finally {
            emit({ type: "done" });
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
      });
    }

    // Non-SSE fallback: original JSON response
    const result = await runCreatifyGeneration(gen, genParams, user, admin, creatifyHeaders, generation_id, costCredits, refundIfNeeded);
    if (!result.ok) return json(result, result.status || 502);
    return json(result);

  } catch (e) {
    console.error("[creatify-generate] error:", e);
    return json({ ok: false, error_code: "INTERNAL", message: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

// ──────────────────────────────────────────────
// Core generation logic, extracted for both SSE and JSON modes
// ──────────────────────────────────────────────
async function runCreatifyGeneration(
  gen: Record<string, unknown>,
  genParams: Record<string, unknown>,
  user: { id: string },
  admin: ReturnType<typeof createClient>,
  creatifyHeaders: Record<string, string>,
  generation_id: string,
  costCredits: number,
  refundIfNeeded: (note: string) => Promise<void>,
  emit?: (data: unknown) => void,
): Promise<Record<string, unknown>> {
  const isUrl = (gen.prompt as string).startsWith("http://") || (gen.prompt as string).startsWith("https://");

  let videoOutputUrl: string | null = null;
  let thumbnailUrl: string | null = null;

  emit?.({ type: "generation_status", status: "generating", generation_id });

  if (isUrl) {
    // === FLOW A: URL-to-Video ===
    const linkEndpoint = "https://api.creatify.ai/api/links/";
    const linkPayload = { url: gen.prompt };
    logPayload(linkEndpoint, linkPayload);

    const linkRes = await fetch(linkEndpoint, { method: "POST", headers: creatifyHeaders, body: JSON.stringify(linkPayload) });
    if (!linkRes.ok) {
      const errDetail = await creatifyError(linkRes, linkEndpoint);
      await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: JSON.stringify(errDetail) });
      await refundIfNeeded("Link creation failed");
      return { ...errDetail, status: 502 };
    }

    const linkData = await linkRes.json();
    console.log("[creatify-generate] Link created:", linkData.id);

    const videoEndpoint = "https://api.creatify.ai/api/link_to_videos/";
    const videoPayload: Record<string, unknown> = {
      link: gen.prompt,
      aspect_ratio: genParams.aspect_ratio || "9x16",
      duration: genParams.duration || 30,
    };
    if (genParams.visual_style) videoPayload.visual_style = genParams.visual_style;
    if (genParams.script_text) videoPayload.script_text = genParams.script_text;
    if (genParams.template_id) videoPayload.template_id = genParams.template_id;
    logPayload(videoEndpoint, videoPayload);

    const createRes = await fetch(videoEndpoint, { method: "POST", headers: creatifyHeaders, body: JSON.stringify(videoPayload) });
    if (!createRes.ok) {
      const errDetail = await creatifyError(createRes, videoEndpoint);
      await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: JSON.stringify(errDetail) });
      await refundIfNeeded("Video creation failed");
      return { ...errDetail, status: 502 };
    }

    const createData = await createRes.json();
    const videoId = createData.id;
    console.log("[creatify-generate] Video job created:", videoId);

    for (let attempt = 0; attempt < 60; attempt++) {
      await new Promise(r => setTimeout(r, 5000));
      const pollRes = await fetch(`https://api.creatify.ai/api/link_to_videos/${videoId}/`, { headers: creatifyHeaders });
      if (!pollRes.ok) continue;
      const pollData = await pollRes.json();
      if (pollData.status === "done" || pollData.status === "completed") {
        videoOutputUrl = pollData.video_output || pollData.output;
        thumbnailUrl = pollData.thumbnail || null;
        break;
      } else if (pollData.status === "failed" || pollData.status === "error") {
        const errMsg = pollData.error || pollData.message || "Video generation failed";
        await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: `Creatify: ${errMsg}` });
        await refundIfNeeded("Creatify video failed");
        return { ok: false, error_code: "CREATIFY_FAILED", message: errMsg, status: 502 };
      }
    }
  } else {
    // === FLOW B: Text-based video ===
    const videoEndpoint = "https://api.creatify.ai/api/link_to_videos/";
    const videoPayload: Record<string, unknown> = {
      script_text: gen.prompt,
      aspect_ratio: genParams.aspect_ratio || "9x16",
      duration: genParams.duration || 30,
    };
    if (genParams.visual_style) videoPayload.visual_style = genParams.visual_style;
    if (genParams.template_id) videoPayload.template_id = genParams.template_id;
    logPayload(videoEndpoint, videoPayload);

    const createRes = await fetch(videoEndpoint, { method: "POST", headers: creatifyHeaders, body: JSON.stringify(videoPayload) });
    if (!createRes.ok) {
      const errDetail = await creatifyError(createRes, videoEndpoint);
      await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: JSON.stringify(errDetail) });
      await refundIfNeeded("Text video creation failed");
      return { ...errDetail, status: 502 };
    }

    const createData = await createRes.json();
    const videoId = createData.id;
    console.log("[creatify-generate] Text video job created:", videoId);

    for (let attempt = 0; attempt < 60; attempt++) {
      await new Promise(r => setTimeout(r, 5000));
      const pollRes = await fetch(`https://api.creatify.ai/api/link_to_videos/${videoId}/`, { headers: creatifyHeaders });
      if (!pollRes.ok) continue;
      const pollData = await pollRes.json();
      if (pollData.status === "done" || pollData.status === "completed") {
        videoOutputUrl = pollData.video_output || pollData.output;
        thumbnailUrl = pollData.thumbnail || null;
        break;
      } else if (pollData.status === "failed" || pollData.status === "error") {
        const errMsg = pollData.error || pollData.message || "Video generation failed";
        await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: `Creatify: ${errMsg}` });
        await refundIfNeeded("Creatify text video failed");
        return { ok: false, error_code: "CREATIFY_FAILED", message: errMsg, status: 502 };
      }
    }
  }

  if (!videoOutputUrl) {
    await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: "Creatify video timed out after 5 minutes" });
    await refundIfNeeded("Timed out");
    return { ok: false, error_code: "TIMEOUT", message: "Video generation timed out", status: 504 };
  }

  // Upload phase
  emit?.({ type: "generation_status", status: "uploading", generation_id });

  const videoRes = await fetch(videoOutputUrl);
  if (!videoRes.ok) {
    await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: "Failed to download generated video" });
    await refundIfNeeded("Download failed");
    return { ok: false, error_code: "DOWNLOAD_FAILED", message: "Failed to download video", status: 502 };
  }

  const videoBytes = new Uint8Array(await videoRes.arrayBuffer());
  const storagePath = `creatify/${user.id}/${generation_id}/video.mp4`;

  const { error: upErr } = await admin.storage
    .from("ai-generated-video")
    .upload(storagePath, videoBytes, { contentType: "video/mp4", upsert: false });

  if (upErr) {
    await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: "Failed to store video" });
    await refundIfNeeded("Upload failed");
    return { ok: false, error_code: "UPLOAD_FAILED", message: "Failed to store video", status: 500 };
  }

  const { data: signedData } = await admin.storage
    .from("ai-generated-video")
    .createSignedUrl(storagePath, 3600);

  let thumbnailStoragePath: string | null = null;
  if (thumbnailUrl) {
    try {
      const thumbRes = await fetch(thumbnailUrl);
      if (thumbRes.ok) {
        const thumbBytes = new Uint8Array(await thumbRes.arrayBuffer());
        thumbnailStoragePath = `creatify/${user.id}/${generation_id}/thumbnail.jpg`;
        await admin.storage.from("ai-generated-video").upload(thumbnailStoragePath, thumbBytes, { contentType: "image/jpeg", upsert: false });
      }
    } catch (e) { console.warn("[creatify-generate] Thumbnail upload failed:", e); }
  }

  const resultVideos = [{
    url: signedData?.signedUrl || videoOutputUrl,
    storage_path: storagePath,
    thumbnail_url: thumbnailUrl || null,
    thumbnail_storage_path: thumbnailStoragePath,
    metadata: { provider: "creatify" },
  }];

  await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "succeeded", p_result_videos: JSON.stringify(resultVideos) });

  if (costCredits > 0) {
    try { await admin.rpc("charge_reserved", { p_ref_type: "video", p_ref_id: generation_id, p_amount: costCredits }); } catch (e) { console.warn("[creatify-generate] charge_reserved failed:", e); }
  }

  console.log("[creatify-generate] Success for generation:", generation_id);

  const finalResult = { ok: true, generation_id, videos: resultVideos };
  emit?.({ type: "generation_status", status: "complete", generation_id, asset_url: resultVideos[0].url });
  return finalResult;
}
