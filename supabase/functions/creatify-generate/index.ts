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
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ ok: false, error_code: "AUTH_REQUIRED", message: "Authentication required" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const creatifyApiId = Deno.env.get("CREATIFY_API_ID");
    const creatifyApiKey = Deno.env.get("CREATIFY_API_KEY");

    if (!creatifyApiId || !creatifyApiKey) {
      return json({ ok: false, error_code: "PROVIDER_NOT_CONFIGURED", message: "Creatify API credentials not configured" }, 500);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !authUser) {
      return json({ ok: false, error_code: "AUTH_REQUIRED", message: "Authentication required" }, 401);
    }
    const userId = authUser.id;

    const body = await req.json();
    const action = body.action || "generate";

    const creatifyHeaders = {
      "Content-Type": "application/json",
      "X-API-ID": creatifyApiId,
      "X-API-KEY": creatifyApiKey,
    };

    const admin = createClient(supabaseUrl, serviceKey);

    // ──────────────────────────────────────────────
    // ACTION: list-templates
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
    // ACTION: check-status — single poll + finalize
    // ──────────────────────────────────────────────
    if (action === "check-status") {
      const { generation_id } = body;
      if (!generation_id) return json({ ok: false, error_code: "BAD_REQUEST", message: "generation_id is required" }, 400);

      const { data: gen, error: genErr } = await admin
        .from("ai_video_generations")
        .select("*")
        .eq("id", generation_id)
        .single();

      if (genErr || !gen) return json({ ok: false, error_code: "NOT_FOUND", message: "Generation not found" }, 404);
      if (gen.user_id !== userId) return json({ ok: false, error_code: "FORBIDDEN", message: "Not your generation" }, 403);

      // Already finalized
      if (gen.status === "succeeded") {
        return json({ ok: true, generation_id, status: "done", videos: gen.result_videos || [] });
      }
      if (gen.status === "failed") {
        return json({ ok: false, generation_id, status: "failed", error: gen.error || "Generation failed" });
      }

      const genParams = gen.params as Record<string, unknown> || {};
      const providerVideoId = genParams.provider_video_id as string;
      if (!providerVideoId) {
        return json({ ok: true, generation_id, status: "processing", message: "Awaiting provider job" });
      }

      const costCredits = genParams.cost_credits ? Number(genParams.cost_credits) : 0;
      const refundIfNeeded = async (note: string) => {
        if (costCredits > 0) {
          try { await admin.rpc("refund_credits", { p_amount: costCredits, p_ref_type: "video", p_ref_id: generation_id, p_note: note }); } catch (_) {}
        }
      };

      // Single poll to Creatify
      const pollRes = await fetch(`https://api.creatify.ai/api/link_to_videos/${providerVideoId}/`, { headers: creatifyHeaders });
      if (!pollRes.ok) {
        console.warn("[creatify-generate] check-status poll failed:", pollRes.status);
        return json({ ok: true, generation_id, status: "processing", message: "Provider check failed, will retry" });
      }

      const pollData = await pollRes.json();

      if (pollData.status === "done" || pollData.status === "completed") {
        const videoOutputUrl = pollData.video_output || pollData.output;
        const thumbnailUrl = pollData.thumbnail || null;

        if (!videoOutputUrl) {
          await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: "No video output URL from provider" });
          await refundIfNeeded("No output URL");
          return json({ ok: false, generation_id, status: "failed", error: "No video output from provider" });
        }

        // Download + upload to storage
        const videoRes = await fetch(videoOutputUrl);
        if (!videoRes.ok) {
          await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: "Failed to download generated video" });
          await refundIfNeeded("Download failed");
          return json({ ok: false, generation_id, status: "failed", error: "Failed to download video" });
        }

        const videoBytes = new Uint8Array(await videoRes.arrayBuffer());
        const storagePath = `creatify/${userId}/${generation_id}/video.mp4`;

        const { error: upErr } = await admin.storage
          .from("ai-generated-video")
          .upload(storagePath, videoBytes, { contentType: "video/mp4", upsert: false });

        if (upErr) {
          await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: "Failed to store video" });
          await refundIfNeeded("Upload failed");
          return json({ ok: false, generation_id, status: "failed", error: "Failed to store video" });
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
              thumbnailStoragePath = `creatify/${userId}/${generation_id}/thumbnail.jpg`;
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

        console.log("[creatify-generate] Finalized generation:", generation_id);
        return json({ ok: true, generation_id, status: "done", videos: resultVideos });
      }

      if (pollData.status === "failed" || pollData.status === "error") {
        const errMsg = pollData.error || pollData.message || "Video generation failed";
        await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: `Creatify: ${errMsg}` });
        await refundIfNeeded("Creatify video failed");
        return json({ ok: false, generation_id, status: "failed", error: errMsg });
      }

      // Still processing
      return json({ ok: true, generation_id, status: "processing" });
    }

    // ──────────────────────────────────────────────
    // ACTION: generate (submit + return immediately)
    // ──────────────────────────────────────────────
    const { generation_id } = body;
    if (!generation_id) return json({ ok: false, error_code: "BAD_REQUEST", message: "generation_id is required" }, 400);

    const { data: gen, error: genErr } = await admin
      .from("ai_video_generations")
      .select("*")
      .eq("id", generation_id)
      .single();

    if (genErr || !gen) return json({ ok: false, error_code: "NOT_FOUND", message: "Generation not found" }, 404);
    if (gen.user_id !== userId) return json({ ok: false, error_code: "FORBIDDEN", message: "Not your generation" }, 403);
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

    const isUrl = (gen.prompt as string).startsWith("http://") || (gen.prompt as string).startsWith("https://");

    try {
      // Step 1: If URL-based, create link first
      if (isUrl) {
        const linkEndpoint = "https://api.creatify.ai/api/links/";
        const linkPayload = { url: gen.prompt };
        logPayload(linkEndpoint, linkPayload);

        const linkRes = await fetch(linkEndpoint, { method: "POST", headers: creatifyHeaders, body: JSON.stringify(linkPayload) });
        if (!linkRes.ok) {
          const errDetail = await creatifyError(linkRes, linkEndpoint);
          await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: JSON.stringify(errDetail) });
          await refundIfNeeded("Link creation failed");
          return json({ ...errDetail, status: 502 }, 502);
        }
        const linkData = await linkRes.json();
        console.log("[creatify-generate] Link created:", linkData.id);
      }

      // Step 2: Submit video creation job
      const videoEndpoint = "https://api.creatify.ai/api/link_to_videos/";
      const videoPayload: Record<string, unknown> = {
        aspect_ratio: genParams.aspect_ratio || "9x16",
        duration: genParams.duration || 30,
      };

      if (isUrl) {
        videoPayload.link = gen.prompt;
      } else {
        videoPayload.script_text = gen.prompt;
      }

      if (genParams.visual_style) videoPayload.visual_style = genParams.visual_style;
      if (genParams.script_text) videoPayload.script_text = genParams.script_text;
      if (genParams.template_id) videoPayload.template_id = genParams.template_id;
      logPayload(videoEndpoint, videoPayload);

      const createRes = await fetch(videoEndpoint, { method: "POST", headers: creatifyHeaders, body: JSON.stringify(videoPayload) });
      if (!createRes.ok) {
        const errDetail = await creatifyError(createRes, videoEndpoint);
        await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: JSON.stringify(errDetail) });
        await refundIfNeeded("Video creation failed");
        return json({ ...errDetail, status: 502 }, 502);
      }

      const createData = await createRes.json();
      const providerVideoId = createData.id;
      console.log("[creatify-generate] Video job submitted:", providerVideoId);

      // Step 3: Persist provider job ID for later status checks
      await admin
        .from("ai_video_generations")
        .update({ params: { ...genParams, provider_video_id: providerVideoId } })
        .eq("id", generation_id);

      // Return immediately — client polls check-status to track completion
      return json({
        ok: true,
        generation_id,
        status: "processing",
        provider_video_id: providerVideoId,
      });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Unknown error during submission";
      console.error("[creatify-generate] Submission error:", e);
      await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: errMsg });
      await refundIfNeeded("Submission error");
      return json({ ok: false, error_code: "SUBMISSION_FAILED", message: errMsg }, 500);
    }

  } catch (e) {
    console.error("[creatify-generate] error:", e);
    return json({ ok: false, error_code: "INTERNAL", message: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
