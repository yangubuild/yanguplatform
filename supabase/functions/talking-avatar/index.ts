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

// ── Provider attempt result ──
interface ProviderResult {
  ok: boolean;
  video_url?: string;
  error?: string;
}

// ── Creatify: talking photo / lipsync ──
async function tryCreatify(
  imageUrl: string,
  text: string | undefined,
  audioUrl: string | undefined,
): Promise<ProviderResult> {
  const apiId = Deno.env.get("CREATIFY_API_ID");
  const apiKey = Deno.env.get("CREATIFY_API_KEY");
  if (!apiId || !apiKey) return { ok: false, error: "Creatify not configured" };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-ID": apiId,
    "X-API-KEY": apiKey,
  };

  // Use the AI Editing / lipsync endpoint
  const payload: Record<string, unknown> = {
    image_url: imageUrl,
  };
  if (audioUrl) {
    payload.audio_url = audioUrl;
  } else if (text) {
    payload.script = text;
  }

  console.log("[talking-avatar] Trying creatify…");
  const createRes = await fetch("https://api.creatify.ai/api/lipsyncs/", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!createRes.ok) {
    const body = await createRes.text();
    console.error("[talking-avatar] creatify create failed:", createRes.status, body);
    return { ok: false, error: `Creatify ${createRes.status}: ${body.slice(0, 300)}` };
  }

  const createData = await createRes.json();
  const jobId = createData.id;
  if (!jobId) return { ok: false, error: "Creatify returned no job id" };

  // Poll for completion (max ~3 min)
  for (let i = 0; i < 36; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const pollRes = await fetch(`https://api.creatify.ai/api/lipsyncs/${jobId}/`, { headers });
    if (!pollRes.ok) continue;
    const poll = await pollRes.json();
    if (poll.status === "done" || poll.status === "completed") {
      const url = poll.output || poll.video_output;
      if (url) return { ok: true, video_url: url };
      return { ok: false, error: "Creatify completed but returned no URL" };
    }
    if (poll.status === "failed" || poll.status === "error") {
      return { ok: false, error: poll.error || poll.message || "Creatify generation failed" };
    }
  }
  return { ok: false, error: "Creatify timed out" };
}

// ── HeyGen: avatar video ──
async function tryHeyGen(
  imageUrl: string,
  text: string | undefined,
  audioUrl: string | undefined,
): Promise<ProviderResult> {
  const apiKey = Deno.env.get("HEYGEN_API_KEY");
  if (!apiKey) return { ok: false, error: "HeyGen not configured" };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Api-Key": apiKey,
  };

  // Build the voice / audio input
  const inputFace: Record<string, unknown> = {
    type: "talk_photo",
    talk_photo_url: imageUrl,
  };
  let voice: Record<string, unknown>;
  if (audioUrl) {
    voice = { type: "audio", audio_url: audioUrl };
  } else {
    voice = { type: "text", input_text: text || "", voice_id: "en-US-JennyNeural" };
  }

  const payload = {
    video_inputs: [
      {
        character: { type: "talk_photo", talk_photo: inputFace },
        voice,
      },
    ],
    dimension: { width: 512, height: 512 },
  };

  console.log("[talking-avatar] Trying heygen…");
  const createRes = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!createRes.ok) {
    const body = await createRes.text();
    console.error("[talking-avatar] heygen create failed:", createRes.status, body);
    return { ok: false, error: `HeyGen ${createRes.status}: ${body.slice(0, 300)}` };
  }

  const createData = await createRes.json();
  const videoId = createData.data?.video_id;
  if (!videoId) return { ok: false, error: "HeyGen returned no video_id" };

  // Poll
  for (let i = 0; i < 36; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const pollRes = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, { headers });
    if (!pollRes.ok) continue;
    const poll = await pollRes.json();
    const status = poll.data?.status;
    if (status === "completed") {
      const url = poll.data?.video_url;
      if (url) return { ok: true, video_url: url };
      return { ok: false, error: "HeyGen completed but no URL" };
    }
    if (status === "failed") {
      return { ok: false, error: poll.data?.error || "HeyGen generation failed" };
    }
  }
  return { ok: false, error: "HeyGen timed out" };
}

// ── D-ID: talks API ──
async function tryDID(
  imageUrl: string,
  text: string | undefined,
  audioUrl: string | undefined,
): Promise<ProviderResult> {
  const apiKey = Deno.env.get("DID_API_KEY");
  if (!apiKey) return { ok: false, error: "D-ID not configured" };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Basic ${apiKey}`,
  };

  const script: Record<string, unknown> = audioUrl
    ? { type: "audio", audio_url: audioUrl }
    : { type: "text", input: text || "", provider: { type: "microsoft", voice_id: "en-US-JennyNeural" } };

  const payload = {
    source_url: imageUrl,
    script,
  };

  console.log("[talking-avatar] Trying d-id…");
  const createRes = await fetch("https://api.d-id.com/talks", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!createRes.ok) {
    const body = await createRes.text();
    console.error("[talking-avatar] d-id create failed:", createRes.status, body);
    return { ok: false, error: `D-ID ${createRes.status}: ${body.slice(0, 300)}` };
  }

  const createData = await createRes.json();
  const talkId = createData.id;
  if (!talkId) return { ok: false, error: "D-ID returned no talk id" };

  // Poll
  for (let i = 0; i < 36; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const pollRes = await fetch(`https://api.d-id.com/talks/${talkId}`, { headers });
    if (!pollRes.ok) continue;
    const poll = await pollRes.json();
    if (poll.status === "done") {
      const url = poll.result_url;
      if (url) return { ok: true, video_url: url };
      return { ok: false, error: "D-ID completed but no URL" };
    }
    if (poll.status === "error" || poll.status === "rejected") {
      return { ok: false, error: poll.error?.description || "D-ID generation failed" };
    }
  }
  return { ok: false, error: "D-ID timed out" };
}

// ── Main handler ──
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
      return json({ ok: false, error: "Authentication required" }, 401);

    let userId: string | null = null;
    try {
      const payload = JSON.parse(atob(authHeader.slice(7).split(".")[1]));
      userId = payload.sub || null;
    } catch (_) { /* ignore */ }
    if (!userId) return json({ ok: false, error: "Authentication required" }, 401);

    const body = await req.json();
    const { image_url, text, audio_url } = body as {
      image_url?: string;
      text?: string;
      audio_url?: string;
    };

    if (!image_url) return json({ ok: false, error: "image_url is required" }, 400);
    if (!text && !audio_url) return json({ ok: false, error: "text or audio_url is required" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Provider chain: creatify → heygen → d-id
    const providers = [
      { name: "creatify", fn: tryCreatify },
      { name: "heygen", fn: tryHeyGen },
      { name: "did", fn: tryDID },
    ] as const;

    let providerUsed = "";
    let fallbackFrom: string | null = null;
    let videoUrl: string | null = null;
    const errors: string[] = [];
    const startMs = Date.now();

    for (const { name, fn } of providers) {
      const result = await fn(image_url, text, audio_url);
      if (result.ok && result.video_url) {
        providerUsed = name;
        videoUrl = result.video_url;
        break;
      }
      errors.push(`${name}: ${result.error}`);
      if (!fallbackFrom) fallbackFrom = name;
      console.warn(`[talking-avatar] ${name} failed, trying next…`);
    }

    const latencyMs = Date.now() - startMs;

    if (!videoUrl) {
      console.error("[talking-avatar] All providers failed:", errors);
      return json({ ok: false, error: "All avatar providers failed", details: errors }, 502);
    }

    // Download & upload to storage
    const dlRes = await fetch(videoUrl);
    if (!dlRes.ok) return json({ ok: false, error: "Failed to download generated video" }, 502);

    const videoBytes = new Uint8Array(await dlRes.arrayBuffer());
    const storagePath = `talking-avatar/${userId}/${crypto.randomUUID()}.mp4`;

    const { error: upErr } = await admin.storage
      .from("ai-generated-video")
      .upload(storagePath, videoBytes, { contentType: "video/mp4", upsert: false });

    if (upErr) {
      console.error("[talking-avatar] Upload error:", upErr);
      return json({ ok: false, error: "Failed to store video" }, 500);
    }

    const { data: signedData } = await admin.storage
      .from("ai-generated-video")
      .createSignedUrl(storagePath, 3600);

    // Store metadata in ada_media
    const metadata = {
      provider_used: providerUsed,
      fallback_from: fallbackFrom,
      generation_latency_ms: latencyMs,
      source_image: image_url,
    };

    const { data: mediaRow } = await admin.from("ada_media").insert({
      user_id: userId,
      provider: providerUsed,
      kind: "talking_avatar",
      storage_path: storagePath,
      metadata,
    }).select("id").single();

    console.log(
      `[talking-avatar] ✓ provider=${providerUsed} fallback=${fallbackFrom || "none"} latency=${latencyMs}ms media_id=${mediaRow?.id}`,
    );

    return json({
      ok: true,
      video_url: signedData?.signedUrl || videoUrl,
      storage_path: storagePath,
      media_id: mediaRow?.id || null,
      metadata,
    });
  } catch (e) {
    console.error("[talking-avatar] error:", e);
    return json({ ok: false, error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
