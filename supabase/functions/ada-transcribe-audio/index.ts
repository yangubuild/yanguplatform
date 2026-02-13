import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { bucket, path } = await req.json();
    if (!bucket || !path) {
      return new Response(
        JSON.stringify({ error: "Missing bucket or path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log env presence (booleans only)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    console.log("[ada-transcribe] env check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
      hasOpenaiKey: !!openaiKey,
    });

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured: missing SUPABASE_URL or SERVICE_ROLE_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY — configure it in backend secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Download audio
    const { data: fileData, error: dlError } = await supabase.storage
      .from(bucket)
      .download(path);

    if (dlError || !fileData) {
      console.error("[ada-transcribe] Storage download error:", dlError);
      return new Response(
        JSON.stringify({ error: "Failed to download audio", detail: dlError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const arrayBuf = await fileData.arrayBuffer();
    console.log("[ada-transcribe] Storage download OK, bytes:", arrayBuf.byteLength);

    // Determine mime/ext
    const ext = path.split(".").pop()?.toLowerCase() ?? "webm";
    const mimeMap: Record<string, string> = {
      webm: "audio/webm",
      ogg: "audio/ogg",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      m4a: "audio/mp4",
    };
    const mimeType = mimeMap[ext] || "audio/webm";
    console.log("[ada-transcribe] mimeType:", mimeType, "ext:", ext);

    // Send to OpenAI Whisper
    const formData = new FormData();
    const audioBlob = new Blob([arrayBuf], { type: mimeType });
    formData.append("file", audioBlob, `audio.${ext}`);
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: formData,
    });

    const whisperBody = await whisperRes.text();
    console.log("[ada-transcribe] Whisper status:", whisperRes.status);
    console.log("[ada-transcribe] Whisper body:", whisperBody);

    if (!whisperRes.ok) {
      // Parse error body
      let parsed: any = {};
      try { parsed = JSON.parse(whisperBody); } catch {}
      const errCode = parsed?.error?.code || "";
      const errMsg = parsed?.error?.message || whisperBody;

      // Quota exceeded – return graceful JSON (200 with ok:false)
      if (whisperRes.status === 429 || errCode === "insufficient_quota") {
        console.log("[ada-transcribe] Quota exceeded, returning graceful response");
        return new Response(
          JSON.stringify({ ok: false, error_code: "INSUFFICIENT_QUOTA", message: "Voice temporarily unavailable. Please try again later." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Auth errors
      if (whisperRes.status === 401 || whisperRes.status === 403) {
        return new Response(
          JSON.stringify({ ok: false, error_code: "AUTH_ERROR", message: "Missing/invalid OPENAI_API_KEY", detail: whisperBody }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ ok: false, error_code: errCode || "UPSTREAM_ERROR", message: errMsg, detail: whisperBody }),
        { status: whisperRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse successful response
    let whisperData: any;
    try {
      whisperData = JSON.parse(whisperBody);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse Whisper response", detail: whisperBody }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        transcript: whisperData.text ?? "",
        language: whisperData.language ?? "unknown",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[ada-transcribe] unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
