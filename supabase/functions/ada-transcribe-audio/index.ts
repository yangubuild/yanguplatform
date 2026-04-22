import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.split(",")[1] : b64;
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function extFromMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("webm")) return "webm";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("mp3") || m.includes("mpeg")) return "mp3";
  if (m.includes("wav")) return "wav";
  if (m.includes("mp4") || m.includes("m4a")) return "m4a";
  return "webm";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[ada-transcribe] request received", {
      method: req.method,
      contentType: req.headers.get("content-type"),
    });

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      console.error("[ada-transcribe] missing OPENAI_API_KEY");
      return jsonResponse({ error: true, message: "Server missing OPENAI_API_KEY" }, 200);
    }

    // Resolve audio bytes from any of the supported input contracts.
    let audioBytes: Uint8Array | null = null;
    let mimeType = "audio/webm";
    let ext = "webm";

    const contentType = req.headers.get("content-type") ?? "";

    try {
      if (contentType.includes("multipart/form-data")) {
        // Contract A: FormData with "file"
        const formData = await req.formData();
        const file = formData.get("file");
        if (file && file instanceof File) {
          const buf = await file.arrayBuffer();
          audioBytes = new Uint8Array(buf);
          mimeType = file.type || "audio/webm";
          ext = extFromMime(mimeType);
        }
      } else {
        // Contract B/C: JSON body — either {audio_base64, mime} or {bucket, path}
        const body = await req.json().catch(() => ({} as any));

        if (body?.audio_base64) {
          audioBytes = base64ToBytes(String(body.audio_base64));
          mimeType = body.mime || "audio/webm";
          ext = extFromMime(mimeType);
        } else if (body?.bucket && body?.path) {
          const supabaseUrl = Deno.env.get("SUPABASE_URL");
          const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
          if (!supabaseUrl || !serviceRoleKey) {
            return jsonResponse({ error: true, message: "Storage backend not configured" }, 200);
          }
          const supabase = createClient(supabaseUrl, serviceRoleKey);
          const { data, error } = await supabase.storage.from(body.bucket).download(body.path);
          if (error || !data) {
            return jsonResponse({ error: true, message: `Download failed: ${error?.message ?? "unknown"}` }, 200);
          }
          const buf = await data.arrayBuffer();
          audioBytes = new Uint8Array(buf);
          ext = String(body.path).split(".").pop()?.toLowerCase() || "webm";
          mimeType = `audio/${ext === "m4a" ? "mp4" : ext}`;
        }
      }
    } catch (parseErr) {
      console.error("[ada-transcribe] body parse error", parseErr);
      return jsonResponse({ error: true, message: "Invalid request body" }, 200);
    }

    if (!audioBytes || audioBytes.byteLength === 0) {
      console.warn("[ada-transcribe] no audio file received");
      return jsonResponse({ error: true, message: "No audio file provided" }, 200);
    }

    console.log("[ada-transcribe] audio bytes:", audioBytes.byteLength, "mime:", mimeType);

    // Send to OpenAI Whisper
    const formData = new FormData();
    const audioBlob = new Blob([audioBytes], { type: mimeType });
    formData.append("file", audioBlob, `audio.${ext}`);
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: formData,
    });

    const whisperBody = await whisperRes.text();
    console.log("[ada-transcribe] provider status:", whisperRes.status);

    if (!whisperRes.ok) {
      let parsed: any = {};
      try { parsed = JSON.parse(whisperBody); } catch {}
      const errCode = parsed?.error?.code || "";
      const errMsg = parsed?.error?.message || whisperBody;
      console.error("[ada-transcribe] provider error:", whisperRes.status, errMsg);

      if (whisperRes.status === 429 || errCode === "insufficient_quota") {
        return jsonResponse({ ok: false, error: true, error_code: "INSUFFICIENT_QUOTA", message: "Voice temporarily unavailable. Please try again later.", text: "" }, 200);
      }
      if (whisperRes.status === 401 || whisperRes.status === 403) {
        return jsonResponse({ ok: false, error: true, error_code: "AUTH_ERROR", message: "Invalid OPENAI_API_KEY", text: "" }, 200);
      }
      return jsonResponse({ ok: false, error: true, error_code: errCode || "UPSTREAM_ERROR", message: errMsg, text: "" }, 200);
    }

    let whisperData: any = {};
    try { whisperData = JSON.parse(whisperBody); } catch {}

    const text = whisperData.text ?? "";
    console.log("[ada-transcribe] transcript length:", text.length);

    return jsonResponse({
      ok: true,
      text,
      transcript: text,
      language: whisperData.language ?? "unknown",
    }, 200);
  } catch (err) {
    console.error("[ada-transcribe] unhandled error:", err);
    return jsonResponse({
      error: true,
      message: err instanceof Error ? err.message : String(err),
      text: "",
    }, 200);
  }
});
