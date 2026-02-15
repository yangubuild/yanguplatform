import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Extract user ID from JWT payload (verify_jwt=false, decode manually)
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const payloadB64 = token.split(".")[1];
        const payload = JSON.parse(atob(payloadB64));
        userId = payload.sub || null;
      } catch (_) { /* ignore */ }
    }

    if (!userId) {
      return json({ ok: false, error_code: "AUTH_REQUIRED", message: "Authentication required" }, 401);
    }
    const user = { id: userId };

    const { prompt, chatId, provider = "openai" } = await req.json();

    if (!prompt || !chatId) {
      return json({ ok: false, error_code: "BAD_REQUEST", message: "prompt and chatId are required" }, 400);
    }

    // Check feature flag
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const flagKey = `enable_image_provider_${provider}`;
    const { data: flag } = await adminClient
      .from("feature_flags")
      .select("enabled")
      .eq("key", flagKey)
      .single();

    if (!flag || !flag.enabled) {
      return json({ ok: false, error_code: "PROVIDER_DISABLED", message: `Provider '${provider}' is not enabled` }, 403);
    }

    // Generate image based on provider
    let imageBytes: Uint8Array;
    let metadata: Record<string, unknown> = {};

    if (provider === "openai") {
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiKey) {
        return json({ ok: false, error_code: "PROVIDER_NOT_CONFIGURED", message: "OpenAI API key not configured" }, 500);
      }

      const openaiRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json",
        }),
      });

      if (!openaiRes.ok) {
        const errText = await openaiRes.text();
        console.error("[ada-generate-image] OpenAI error:", openaiRes.status, errText);
        return json({ ok: false, error_code: "OPENAI_ERROR", message: "Image generation failed" }, 502);
      }

      const openaiData = await openaiRes.json();
      const b64 = openaiData.data?.[0]?.b64_json;
      if (!b64) {
        return json({ ok: false, error_code: "OPENAI_NO_IMAGE", message: "No image returned" }, 502);
      }

      // Decode base64
      const binaryStr = atob(b64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      imageBytes = bytes;

      metadata = {
        model: "dall-e-3",
        size: "1024x1024",
        revised_prompt: openaiData.data?.[0]?.revised_prompt || prompt,
      };
    } else if (provider === "qwen") {
      return json({ ok: false, error_code: "PROVIDER_DISABLED", message: "Qwen provider is not yet available" }, 403);
    } else {
      return json({ ok: false, error_code: "UNKNOWN_PROVIDER", message: `Unknown provider: ${provider}` }, 400);
    }

    // Upload to ada-media bucket
    const timestamp = Date.now();
    const storagePath = `${user.id}/${chatId}/${timestamp}.png`;

    const { error: uploadErr } = await adminClient.storage
      .from("ada-media")
      .upload(storagePath, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadErr) {
      console.error("[ada-generate-image] Upload error:", uploadErr);
      return json({ ok: false, error_code: "UPLOAD_FAILED", message: "Failed to store image" }, 500);
    }

    // Get signed URL (1 hour)
    const { data: signedData, error: signedErr } = await adminClient.storage
      .from("ada-media")
      .createSignedUrl(storagePath, 3600);

    if (signedErr) {
      console.error("[ada-generate-image] Signed URL error:", signedErr);
    }

    const imageUrl = signedData?.signedUrl || "";

    // Insert ada_media record
    const { error: mediaErr } = await adminClient
      .from("ada_media")
      .insert({
        chat_id: chatId,
        user_id: user.id,
        kind: "image",
        provider,
        storage_path: storagePath,
        metadata,
      });

    if (mediaErr) {
      console.error("[ada-generate-image] ada_media insert error:", mediaErr);
    }

    // Insert assistant message with image reference
    const assistantContent = `![Generated image](${imageUrl})\n\n*Generated with ${provider === "openai" ? "DALL·E 3" : provider}*`;
    const { error: msgErr } = await adminClient
      .from("ada_messages")
      .insert({
        chat_id: chatId,
        role: "assistant",
        content: assistantContent,
        metadata: { type: "image", provider, storage_path: storagePath, ...metadata },
      });

    if (msgErr) {
      console.error("[ada-generate-image] message insert error:", msgErr);
    }

    return json({
      ok: true,
      image_url: imageUrl,
      provider,
      storage_path: storagePath,
      metadata,
    });
  } catch (e) {
    console.error("[ada-generate-image] error:", e);
    return json({ ok: false, error_code: "INTERNAL", message: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
