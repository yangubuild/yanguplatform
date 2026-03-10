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

    // Verify user via Supabase Auth (not raw JWT decode)
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ ok: false, error_code: "AUTH_REQUIRED", message: "Authentication required" }, 401);
    }
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !authUser) {
      return json({ ok: false, error_code: "AUTH_REQUIRED", message: "Authentication required" }, 401);
    }
    const user = { id: authUser.id };

    const body = await req.json();
    const { prompt, chatId, debug = false } = body;
    let provider: string = body.provider || "";
    const genStart = Date.now();

    // --- Provider hinting: auto-select best provider if none explicitly requested ---
    if (!provider) {
      const lowerPrompt = (prompt || "").toLowerCase();
      if (/\b(logo|brand|typography|text poster|flyer)\b/.test(lowerPrompt)) {
        provider = "ideogram";
      } else if (/\b(fashion|realistic person|portrait|product shot)\b/.test(lowerPrompt)) {
        provider = "gemini";
      } else if (/\b(anime|stylized|illustration)\b/.test(lowerPrompt)) {
        provider = "qwen";
      } else {
        provider = "openai";
      }
      console.log(`[ada-generate-image] Provider hinted to '${provider}' from prompt`);
    }

    if (!prompt) {
      return json({ ok: false, error_code: "BAD_REQUEST", message: "prompt is required" }, 400);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // --- Quota enforcement ---
    // Quota is enforced client-side via RPC before calling this function.
    // No duplicate check here to avoid double-counting.

    // Check feature flag
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
    let modelUsed = "";

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
      modelUsed = "dall-e-3";
    } else if (provider === "gemini") {
      let geminiOk = false;
      try {
        const lovableKey = Deno.env.get("LOVABLE_API_KEY");
        if (!lovableKey) throw new Error("Lovable API key not configured");

        const geminiRes = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            prompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json",
          }),
        });

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          console.warn("[ada-generate-image] Gemini failed, will fallback to OpenAI:", geminiRes.status, errText);
          throw new Error("Gemini request failed");
        }

        const geminiData = await geminiRes.json();
        const b64 = geminiData.data?.[0]?.b64_json;
        if (!b64) throw new Error("No image returned from Gemini");

        const binaryStr = atob(b64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        imageBytes = bytes;

        metadata = {
          model: "google/gemini-2.5-flash-image",
          size: "1024x1024",
          revised_prompt: geminiData.data?.[0]?.revised_prompt || prompt,
        };
        modelUsed = "google/gemini-2.5-flash-image";
        geminiOk = true;
      } catch (geminiErr) {
        console.warn("[ada-generate-image] Gemini error, falling back to OpenAI:", geminiErr);
      }

      // Fallback to OpenAI if Gemini failed
      if (!geminiOk) {
        const openaiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiKey) {
          return json({ ok: false, error_code: "PROVIDER_NOT_CONFIGURED", message: "Fallback provider (OpenAI) not configured" }, 500);
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
          console.error("[ada-generate-image] OpenAI fallback also failed:", openaiRes.status, errText);
          return json({ ok: false, error_code: "ALL_PROVIDERS_FAILED", message: "Image generation failed across all providers" }, 502);
        }

        const openaiData = await openaiRes.json();
        const b64 = openaiData.data?.[0]?.b64_json;
        if (!b64) {
          return json({ ok: false, error_code: "OPENAI_NO_IMAGE", message: "No image returned from fallback" }, 502);
        }

        const binaryStr = atob(b64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        imageBytes = bytes;

        metadata = {
          model: "dall-e-3",
          size: "1024x1024",
          revised_prompt: openaiData.data?.[0]?.revised_prompt || prompt,
          fallback_from: "gemini",
        };
        modelUsed = "dall-e-3 (fallback)";
      }
    } else if (provider === "qwen") {
      return json({ ok: false, error_code: "PROVIDER_DISABLED", message: "Qwen provider is not yet available" }, 403);
    } else {
      return json({ ok: false, error_code: "UNKNOWN_PROVIDER", message: `Unknown provider: ${provider}` }, 400);
    }

    const generationLatencyMs = Date.now() - genStart;

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

    // Enrich metadata with provider trace fields
    const fallbackFrom = metadata.fallback_from || null;
    const enrichedMetadata = {
      ...metadata,
      provider_used: fallbackFrom ? "openai" : provider,
      model_used: modelUsed,
      prompt_text: prompt,
      fallback_from: fallbackFrom,
      generation_latency_ms: generationLatencyMs,
    };

    // Insert ada_media record (only if chatId provided)
    let mediaRow: { id: string } | null = null;
    if (chatId) {
      const { data: row, error: mediaErr } = await adminClient
        .from("ada_media")
        .insert({
          chat_id: chatId,
          user_id: user.id,
          kind: "image",
          provider: fallbackFrom ? "openai" : provider,
          storage_path: storagePath,
          metadata: enrichedMetadata,
        })
        .select("id")
        .single();

      if (mediaErr) {
        console.error("[ada-generate-image] ada_media insert error:", mediaErr);
      }
      mediaRow = row;

      // Insert assistant message with image reference
      const providerLabel = provider === "openai" ? "DALL·E 3" : provider === "gemini" ? "Gemini" : provider;
      const assistantContent = `![Generated image](${imageUrl})\n\n*Generated with ${providerLabel}*`;
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
    }

    const response: Record<string, unknown> = {
      ok: true,
      image_url: imageUrl,
      provider,
      storage_path: storagePath,
      metadata,
    };

    if (debug) {
      response.provider_used = enrichedMetadata.provider_used;
      response.model_used = modelUsed;
      response.generation_latency_ms = generationLatencyMs;
      response.upload_path = `ada-media/${storagePath}`;
      response.media_id = mediaRow?.id || null;
      response.fallback_from = fallbackFrom;
    }

    return json(response);
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
