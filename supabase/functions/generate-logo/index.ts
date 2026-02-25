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
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.sub || null;
      } catch (_) {}
    }
    if (!userId) return json({ ok: false, error: "Auth required" }, 401);

    const { prompt } = await req.json();
    if (!prompt) return json({ ok: false, error: "prompt is required" }, 400);

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return json({ ok: false, error: "AI not configured" }, 500);

    // Use Lovable AI gateway for image generation
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[generate-logo] AI error:", aiRes.status, errText);
      return json({ ok: false, error: "Image generation failed" }, 502);
    }

    const aiData = await aiRes.json();
    const base64Url = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!base64Url) {
      console.error("[generate-logo] No image in response:", JSON.stringify(aiData).slice(0, 500));
      return json({ ok: false, error: "No image returned" }, 502);
    }

    // Upload to builder-media bucket
    const base64Data = base64Url.split(",")[1];
    if (!base64Data) return json({ ok: false, error: "Invalid image data" }, 502);

    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const path = `${userId}/logos/${Date.now()}-ai-logo.png`;
    const { error: uploadErr } = await admin.storage
      .from("builder-media")
      .upload(path, bytes, { contentType: "image/png", upsert: false });

    if (uploadErr) {
      console.error("[generate-logo] Upload error:", uploadErr);
      return json({ ok: false, error: "Upload failed" }, 500);
    }

    const { data: publicData } = admin.storage.from("builder-media").getPublicUrl(path);

    return json({ ok: true, image_url: publicData.publicUrl });
  } catch (e) {
    console.error("[generate-logo] error:", e);
    return json({ ok: false, error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
