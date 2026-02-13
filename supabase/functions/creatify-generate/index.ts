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

    // Verify user
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ ok: false, error_code: "AUTH_INVALID", message: "Invalid auth token" }, 401);

    const { generation_id } = await req.json();
    if (!generation_id) return json({ ok: false, error_code: "BAD_REQUEST", message: "generation_id is required" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Load generation row
    const { data: gen, error: genErr } = await admin
      .from("ai_video_generations")
      .select("*")
      .eq("id", generation_id)
      .single();

    if (genErr || !gen) return json({ ok: false, error_code: "NOT_FOUND", message: "Generation not found" }, 404);
    if (gen.user_id !== user.id) return json({ ok: false, error_code: "FORBIDDEN", message: "Not your generation" }, 403);
    if (gen.status !== "queued") return json({ ok: false, error_code: "ALREADY_PROCESSING", message: `Status is already ${gen.status}` }, 409);

    // Set processing
    await admin.rpc("set_video_generation_status", { p_generation_id: generation_id, p_status: "processing" });

    const genParams = gen.params as Record<string, unknown> || {};
    const creatifyHeaders = {
      "Content-Type": "application/json",
      "X-API-ID": creatifyApiId,
      "X-API-KEY": creatifyApiKey,
    };

    console.log("[creatify-generate] Starting for generation:", generation_id);

    // The prompt is treated as a product URL for link-to-video,
    // or as a text description. We'll use link_to_videos endpoint.
    // If prompt looks like a URL, use it directly; otherwise use it as script text.
    const isUrl = gen.prompt.startsWith("http://") || gen.prompt.startsWith("https://");

    let videoOutputUrl: string | null = null;
    let thumbnailUrl: string | null = null;

    if (isUrl) {
      // === FLOW A: URL-to-Video (2-step: create link, then create video) ===

      // Step 1: Create link
      console.log("[creatify-generate] Creating link from URL:", gen.prompt);
      const linkRes = await fetch("https://api.creatify.ai/api/links/", {
        method: "POST",
        headers: creatifyHeaders,
        body: JSON.stringify({ url: gen.prompt }),
      });

      if (!linkRes.ok) {
        const errText = await linkRes.text();
        console.error("[creatify-generate] Link creation failed:", linkRes.status, errText);
        await admin.rpc("set_video_generation_status", {
          p_generation_id: generation_id,
          p_status: "failed",
          p_error: `Creatify link creation failed: ${linkRes.status}`,
        });
        return json({ ok: false, error_code: "CREATIFY_ERROR", message: "Link creation failed" }, 502);
      }

      const linkData = await linkRes.json();
      const linkId = linkData.id;
      console.log("[creatify-generate] Link created:", linkId);

      // Step 2: Create video from link
      const videoBody: Record<string, unknown> = {
        link_id: linkId,
        aspect_ratio: genParams.aspect_ratio || "9:16",
        duration: genParams.duration || 30,
      };
      if (genParams.visual_style) videoBody.visual_style = genParams.visual_style;
      if (genParams.script_text) videoBody.script_text = genParams.script_text;

      const createRes = await fetch("https://api.creatify.ai/api/link_to_videos/", {
        method: "POST",
        headers: creatifyHeaders,
        body: JSON.stringify(videoBody),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        console.error("[creatify-generate] Video creation failed:", createRes.status, errText);
        await admin.rpc("set_video_generation_status", {
          p_generation_id: generation_id,
          p_status: "failed",
          p_error: `Creatify video creation failed: ${createRes.status}`,
        });
        return json({ ok: false, error_code: "CREATIFY_ERROR", message: "Video creation failed" }, 502);
      }

      const createData = await createRes.json();
      const videoId = createData.id;
      console.log("[creatify-generate] Video job created:", videoId);

      // Step 3: Poll for completion (max ~5 min)
      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise(r => setTimeout(r, 5000));

        const pollRes = await fetch(`https://api.creatify.ai/api/link_to_videos/${videoId}/`, {
          headers: creatifyHeaders,
        });

        if (!pollRes.ok) {
          console.error("[creatify-generate] Poll error:", pollRes.status);
          continue;
        }

        const pollData = await pollRes.json();
        const status = pollData.status;

        if (status === "done" || status === "completed") {
          videoOutputUrl = pollData.video_output || pollData.output;
          thumbnailUrl = pollData.thumbnail || null;
          console.log("[creatify-generate] Video completed:", videoOutputUrl);
          break;
        } else if (status === "failed" || status === "error") {
          const errMsg = pollData.error || pollData.message || "Video generation failed";
          console.error("[creatify-generate] Video failed:", errMsg);
          await admin.rpc("set_video_generation_status", {
            p_generation_id: generation_id,
            p_status: "failed",
            p_error: `Creatify: ${errMsg}`,
          });
          return json({ ok: false, error_code: "CREATIFY_FAILED", message: errMsg }, 502);
        }
        // pending/processing → keep polling
      }
    } else {
      // === FLOW B: Text-based video (use link_to_videos with a script) ===
      // For text prompts without a URL, we still use the API but pass script_text
      // We need a placeholder link — use Creatify's text-to-video if available
      // Fallback: treat the prompt as a script and create a minimal link

      const videoBody: Record<string, unknown> = {
        script_text: gen.prompt,
        aspect_ratio: genParams.aspect_ratio || "9:16",
        duration: genParams.duration || 30,
      };
      if (genParams.visual_style) videoBody.visual_style = genParams.visual_style;

      const createRes = await fetch("https://api.creatify.ai/api/link_to_videos/", {
        method: "POST",
        headers: creatifyHeaders,
        body: JSON.stringify(videoBody),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        console.error("[creatify-generate] Text video creation failed:", createRes.status, errText);
        await admin.rpc("set_video_generation_status", {
          p_generation_id: generation_id,
          p_status: "failed",
          p_error: `Creatify text video failed: ${createRes.status} — ${errText}`,
        });
        return json({ ok: false, error_code: "CREATIFY_ERROR", message: "Video creation failed" }, 502);
      }

      const createData = await createRes.json();
      const videoId = createData.id;
      console.log("[creatify-generate] Text video job created:", videoId);

      // Poll for completion
      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise(r => setTimeout(r, 5000));

        const pollRes = await fetch(`https://api.creatify.ai/api/link_to_videos/${videoId}/`, {
          headers: creatifyHeaders,
        });

        if (!pollRes.ok) continue;

        const pollData = await pollRes.json();
        const status = pollData.status;

        if (status === "done" || status === "completed") {
          videoOutputUrl = pollData.video_output || pollData.output;
          thumbnailUrl = pollData.thumbnail || null;
          break;
        } else if (status === "failed" || status === "error") {
          const errMsg = pollData.error || pollData.message || "Video generation failed";
          await admin.rpc("set_video_generation_status", {
            p_generation_id: generation_id,
            p_status: "failed",
            p_error: `Creatify: ${errMsg}`,
          });
          return json({ ok: false, error_code: "CREATIFY_FAILED", message: errMsg }, 502);
        }
      }
    }

    if (!videoOutputUrl) {
      await admin.rpc("set_video_generation_status", {
        p_generation_id: generation_id,
        p_status: "failed",
        p_error: "Creatify video timed out after 5 minutes",
      });
      return json({ ok: false, error_code: "TIMEOUT", message: "Video generation timed out" }, 504);
    }

    // Download and upload the video to storage
    const videoRes = await fetch(videoOutputUrl);
    if (!videoRes.ok) {
      console.error("[creatify-generate] Failed to download video:", videoRes.status);
      await admin.rpc("set_video_generation_status", {
        p_generation_id: generation_id,
        p_status: "failed",
        p_error: "Failed to download generated video",
      });
      return json({ ok: false, error_code: "DOWNLOAD_FAILED", message: "Failed to download video" }, 502);
    }

    const videoBytes = new Uint8Array(await videoRes.arrayBuffer());
    const storagePath = `creatify/${user.id}/${generation_id}/video.mp4`;

    const { error: upErr } = await admin.storage
      .from("ai-generated-video")
      .upload(storagePath, videoBytes, { contentType: "video/mp4", upsert: false });

    if (upErr) {
      console.error("[creatify-generate] Upload error:", upErr);
      await admin.rpc("set_video_generation_status", {
        p_generation_id: generation_id,
        p_status: "failed",
        p_error: "Failed to store video",
      });
      return json({ ok: false, error_code: "UPLOAD_FAILED", message: "Failed to store video" }, 500);
    }

    const { data: signedData } = await admin.storage
      .from("ai-generated-video")
      .createSignedUrl(storagePath, 3600);

    // Upload thumbnail if available
    let thumbnailStoragePath: string | null = null;
    if (thumbnailUrl) {
      try {
        const thumbRes = await fetch(thumbnailUrl);
        if (thumbRes.ok) {
          const thumbBytes = new Uint8Array(await thumbRes.arrayBuffer());
          thumbnailStoragePath = `creatify/${user.id}/${generation_id}/thumbnail.jpg`;
          await admin.storage
            .from("ai-generated-video")
            .upload(thumbnailStoragePath, thumbBytes, { contentType: "image/jpeg", upsert: false });
        }
      } catch (e) {
        console.warn("[creatify-generate] Thumbnail upload failed:", e);
      }
    }

    const resultVideos = [{
      url: signedData?.signedUrl || videoOutputUrl,
      storage_path: storagePath,
      thumbnail_url: thumbnailUrl || null,
      thumbnail_storage_path: thumbnailStoragePath,
      metadata: { provider: "creatify" },
    }];

    await admin.rpc("set_video_generation_status", {
      p_generation_id: generation_id,
      p_status: "succeeded",
      p_result_videos: JSON.stringify(resultVideos),
    });

    console.log("[creatify-generate] Success for generation:", generation_id);

    return json({
      ok: true,
      generation_id,
      videos: resultVideos,
    });
  } catch (e) {
    console.error("[creatify-generate] error:", e);
    return json({ ok: false, error_code: "INTERNAL", message: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
