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
    // Verify caller is authenticated
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

    // Use service role to download the audio file
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: fileData, error: dlError } = await supabase.storage
      .from(bucket)
      .download(path);

    if (dlError || !fileData) {
      console.error("Storage download error:", dlError);
      return new Response(
        JSON.stringify({ error: "Failed to download audio", detail: dlError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine mime type from extension
    const ext = path.split(".").pop()?.toLowerCase() ?? "webm";
    const mimeMap: Record<string, string> = {
      webm: "audio/webm",
      ogg: "audio/ogg",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      m4a: "audio/mp4",
    };
    const mimeType = mimeMap[ext] || "audio/webm";

    // Send to OpenAI Whisper
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = new FormData();
    const audioBlob = new Blob([await fileData.arrayBuffer()], { type: mimeType });
    formData.append("file", audioBlob, `audio.${ext}`);
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");
    // Don't set language — let Whisper auto-detect (supports en, fr, ar, sw, ha, yo, am)

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: formData,
    });

    if (!whisperRes.ok) {
      const errText = await whisperRes.text();
      console.error("Whisper error:", errText);
      return new Response(
        JSON.stringify({ error: "Whisper transcription failed", detail: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const whisperData = await whisperRes.json();

    return new Response(
      JSON.stringify({
        transcript: whisperData.text ?? "",
        language: whisperData.language ?? "unknown",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ada-transcribe-audio error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
