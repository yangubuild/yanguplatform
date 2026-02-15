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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ideogramKey = Deno.env.get("IDEOGRAM_API_KEY");

    if (!ideogramKey) return json({ ok: false, error_code: "PROVIDER_NOT_CONFIGURED", message: "Ideogram API key not configured" }, 500);

    // Extract user ID from JWT payload (verify_jwt=false, so we decode manually)
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const payloadB64 = token.split(".")[1];
        const payload = JSON.parse(atob(payloadB64));
        userId = payload.sub || null;
      } catch (_) { /* ignore decode errors */ }
    }

    if (!userId) return json({ ok: false, error_code: "AUTH_REQUIRED", message: "Authentication required" }, 401);
    const user = { id: userId };

    const { generation_id } = await req.json();
    if (!generation_id) return json({ ok: false, error_code: "BAD_REQUEST", message: "generation_id is required" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Load generation row
    const { data: gen, error: genErr } = await admin
      .from("ai_image_generations")
      .select("*")
      .eq("id", generation_id)
      .single();

    if (genErr || !gen) return json({ ok: false, error_code: "NOT_FOUND", message: "Generation not found" }, 404);
    if (gen.user_id !== user.id) return json({ ok: false, error_code: "FORBIDDEN", message: "Not your generation" }, 403);
    if (gen.status !== "queued") return json({ ok: false, error_code: "ALREADY_PROCESSING", message: `Status is already ${gen.status}` }, 409);

    // Set processing
    await admin.rpc("set_generation_status", { p_generation_id: generation_id, p_status: "processing" });

    // Build Ideogram request
    const ideogramParams = gen.params || {};
    const ideogramBody: Record<string, unknown> = {
      image_request: {
        prompt: gen.prompt,
        model: ideogramParams.model || "V_2",
        magic_prompt_option: ideogramParams.magic_prompt_option || "AUTO",
        aspect_ratio: ideogramParams.aspect_ratio || "ASPECT_1_1",
        ...(ideogramParams.style_type ? { style_type: ideogramParams.style_type } : {}),
        ...(ideogramParams.negative_prompt ? { negative_prompt: ideogramParams.negative_prompt } : {}),
      },
    };

    console.log("[ideogram-generate] Calling Ideogram API for generation:", generation_id);

    const ideRes = await fetch("https://api.ideogram.ai/generate", {
      method: "POST",
      headers: {
        "Api-Key": ideogramKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ideogramBody),
    });

    if (!ideRes.ok) {
      const errText = await ideRes.text();
      console.error("[ideogram-generate] Ideogram API error:", ideRes.status, errText);
      await admin.rpc("set_generation_status", {
        p_generation_id: generation_id,
        p_status: "failed",
        p_error: `Ideogram API error: ${ideRes.status}`,
      });
      // Refund reserved credits on failure
      const costCredits = (gen.params as Record<string, unknown>)?.cost_credits;
      if (costCredits && Number(costCredits) > 0) {
        try { await admin.rpc("refund_credits", { p_amount: Number(costCredits), p_ref_type: "image", p_ref_id: generation_id, p_note: "Ideogram API error" }); } catch (_) {}
      }
      return json({ ok: false, error_code: "IDEOGRAM_ERROR", message: "Image generation failed" }, 502);
    }

    const ideData = await ideRes.json();
    const images = ideData.data || [];

    if (images.length === 0) {
      await admin.rpc("set_generation_status", {
        p_generation_id: generation_id,
        p_status: "failed",
        p_error: "No images returned from Ideogram",
      });
      const costCredits2 = (gen.params as Record<string, unknown>)?.cost_credits;
      if (costCredits2 && Number(costCredits2) > 0) {
        try { await admin.rpc("refund_credits", { p_amount: Number(costCredits2), p_ref_type: "image", p_ref_id: generation_id, p_note: "No images returned" }); } catch (_) {}
      }
      return json({ ok: false, error_code: "NO_IMAGES", message: "No images returned" }, 502);
    }

    // Download and upload each image to storage
    const resultImages: { url: string; storage_path: string; is_image_safe: boolean; seed: number }[] = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const imageUrl = img.url;
      if (!imageUrl) continue;

      // Download image bytes
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        console.error(`[ideogram-generate] Failed to download image ${i}:`, imgRes.status);
        continue;
      }
      const imgBytes = new Uint8Array(await imgRes.arrayBuffer());

      const storagePath = `ideogram/${user.id}/${generation_id}/${i}.png`;
      const { error: upErr } = await admin.storage
        .from("ai-generated")
        .upload(storagePath, imgBytes, { contentType: "image/png", upsert: false });

      if (upErr) {
        console.error(`[ideogram-generate] Upload error for image ${i}:`, upErr);
        continue;
      }

      // Get signed URL (1 hour)
      const { data: signedData } = await admin.storage
        .from("ai-generated")
        .createSignedUrl(storagePath, 3600);

      resultImages.push({
        url: signedData?.signedUrl || imageUrl,
        storage_path: storagePath,
        is_image_safe: img.is_image_safe ?? true,
        seed: img.seed ?? 0,
      });
    }

    if (resultImages.length === 0) {
      await admin.rpc("set_generation_status", {
        p_generation_id: generation_id,
        p_status: "failed",
        p_error: "Failed to store any images",
      });
      const costCredits3 = (gen.params as Record<string, unknown>)?.cost_credits;
      if (costCredits3 && Number(costCredits3) > 0) {
        try { await admin.rpc("refund_credits", { p_amount: Number(costCredits3), p_ref_type: "image", p_ref_id: generation_id, p_note: "Upload failed" }); } catch (_) {}
      }
      return json({ ok: false, error_code: "UPLOAD_FAILED", message: "Failed to store images" }, 500);
    }

    // Update generation as succeeded
    await admin.rpc("set_generation_status", {
      p_generation_id: generation_id,
      p_status: "succeeded",
      p_result_images: JSON.stringify(resultImages),
    });

    // Charge reserved credits on success
    const costCredits = (gen.params as Record<string, unknown>)?.cost_credits;
    if (costCredits && Number(costCredits) > 0) {
      try {
        await admin.rpc("charge_reserved", { p_ref_type: "image", p_ref_id: generation_id, p_amount: Number(costCredits) });
      } catch (e) { console.warn("[ideogram-generate] charge_reserved failed:", e); }
    }

    console.log("[ideogram-generate] Success:", resultImages.length, "images for generation:", generation_id);

    return json({
      ok: true,
      generation_id,
      images: resultImages,
    });
  } catch (e) {
    console.error("[ideogram-generate] error:", e);
    return json({ ok: false, error_code: "INTERNAL", message: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
