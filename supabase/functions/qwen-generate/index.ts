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
    const qwenKey = Deno.env.get("QWEN_API_KEY");

    if (!qwenKey) return json({ ok: false, error_code: "PROVIDER_NOT_CONFIGURED", message: "Qwen API key not configured" }, 500);

    // Extract user ID from JWT payload (verify_jwt=false, so we decode manually)
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const payloadB64 = token.split(".")[1];
        const payload = JSON.parse(atob(payloadB64));
        userId = payload.sub || null;
      } catch (_) { /* ignore */ }
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

    // Build Qwen request — uses DashScope-compatible API
    const qwenParams = gen.params || {};
    const qwenBody = {
      model: qwenParams.model || "wanx-v1",
      input: {
        prompt: gen.prompt,
        ...(qwenParams.negative_prompt ? { negative_prompt: qwenParams.negative_prompt } : {}),
      },
      parameters: {
        n: 1,
        size: qwenParams.size || "1024*1024",
        ...(qwenParams.style ? { style: qwenParams.style } : {}),
      },
    };

    console.log("[qwen-generate] Calling Qwen/DashScope API for generation:", generation_id);

    // Step 1: Submit async task
    const submitRes = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${qwenKey}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify(qwenBody),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      console.error("[qwen-generate] Qwen submit error:", submitRes.status, errText);
      await admin.rpc("set_generation_status", {
        p_generation_id: generation_id,
        p_status: "failed",
        p_error: `Qwen API error: ${submitRes.status}`,
      });
      const cc = (gen.params as Record<string, unknown>)?.cost_credits;
      if (cc && Number(cc) > 0) { try { await admin.rpc("refund_credits", { p_amount: Number(cc), p_ref_type: "image", p_ref_id: generation_id, p_note: "Qwen submit error" }); } catch (_) {} }
      return json({ ok: false, error_code: "QWEN_ERROR", message: "Image generation submission failed" }, 502);
    }

    const submitData = await submitRes.json();
    const taskId = submitData.output?.task_id;

    if (!taskId) {
      console.error("[qwen-generate] No task_id in response:", JSON.stringify(submitData));
      await admin.rpc("set_generation_status", {
        p_generation_id: generation_id,
        p_status: "failed",
        p_error: "No task_id returned from Qwen",
      });
      const cc2 = (gen.params as Record<string, unknown>)?.cost_credits;
      if (cc2 && Number(cc2) > 0) { try { await admin.rpc("refund_credits", { p_amount: Number(cc2), p_ref_type: "image", p_ref_id: generation_id, p_note: "No task_id" }); } catch (_) {} }
      return json({ ok: false, error_code: "QWEN_ERROR", message: "No task ID returned" }, 502);
    }

    // Step 2: Poll for completion (max ~60s)
    let taskResult: Record<string, unknown> | null = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise(r => setTimeout(r, 2000));

      const pollRes = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
        headers: { "Authorization": `Bearer ${qwenKey}` },
      });

      if (!pollRes.ok) {
        console.error("[qwen-generate] Poll error:", pollRes.status);
        continue;
      }

      const pollData = await pollRes.json();
      const status = pollData.output?.task_status;

      if (status === "SUCCEEDED") {
        taskResult = pollData;
        break;
      } else if (status === "FAILED") {
        const errMsg = pollData.output?.message || "Task failed";
        console.error("[qwen-generate] Task failed:", errMsg);
        await admin.rpc("set_generation_status", {
          p_generation_id: generation_id,
          p_status: "failed",
          p_error: `Qwen task failed: ${errMsg}`,
        });
        const cc3 = (gen.params as Record<string, unknown>)?.cost_credits;
        if (cc3 && Number(cc3) > 0) { try { await admin.rpc("refund_credits", { p_amount: Number(cc3), p_ref_type: "image", p_ref_id: generation_id, p_note: "Qwen task failed" }); } catch (_) {} }
        return json({ ok: false, error_code: "QWEN_TASK_FAILED", message: errMsg }, 502);
      }
      // PENDING / RUNNING → keep polling
    }

    if (!taskResult) {
      await admin.rpc("set_generation_status", {
        p_generation_id: generation_id,
        p_status: "failed",
        p_error: "Qwen task timed out after 60s",
      });
      const cc4 = (gen.params as Record<string, unknown>)?.cost_credits;
      if (cc4 && Number(cc4) > 0) { try { await admin.rpc("refund_credits", { p_amount: Number(cc4), p_ref_type: "image", p_ref_id: generation_id, p_note: "Timeout" }); } catch (_) {} }
      return json({ ok: false, error_code: "TIMEOUT", message: "Image generation timed out" }, 504);
    }

    // Extract images
    const results = (taskResult as Record<string, unknown>).output as Record<string, unknown>;
    const rawImages = (results.results || []) as { url?: string }[];

    if (rawImages.length === 0) {
      await admin.rpc("set_generation_status", {
        p_generation_id: generation_id,
        p_status: "failed",
        p_error: "No images returned from Qwen",
      });
      const cc5 = (gen.params as Record<string, unknown>)?.cost_credits;
      if (cc5 && Number(cc5) > 0) { try { await admin.rpc("refund_credits", { p_amount: Number(cc5), p_ref_type: "image", p_ref_id: generation_id, p_note: "No images" }); } catch (_) {} }
      return json({ ok: false, error_code: "NO_IMAGES", message: "No images returned" }, 502);
    }

    // Download and upload each image
    const resultImages: { url: string; storage_path: string; is_image_safe: boolean; seed: number }[] = [];

    for (let i = 0; i < rawImages.length; i++) {
      const imageUrl = rawImages[i].url;
      if (!imageUrl) continue;

      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        console.error(`[qwen-generate] Failed to download image ${i}:`, imgRes.status);
        continue;
      }
      const imgBytes = new Uint8Array(await imgRes.arrayBuffer());

      const storagePath = `qwen/${user.id}/${generation_id}/${i}.png`;
      const { error: upErr } = await admin.storage
        .from("ai-generated")
        .upload(storagePath, imgBytes, { contentType: "image/png", upsert: false });

      if (upErr) {
        console.error(`[qwen-generate] Upload error for image ${i}:`, upErr);
        continue;
      }

      const { data: signedData } = await admin.storage
        .from("ai-generated")
        .createSignedUrl(storagePath, 3600);

      resultImages.push({
        url: signedData?.signedUrl || imageUrl,
        storage_path: storagePath,
        is_image_safe: true,
        seed: 0,
      });
    }

    if (resultImages.length === 0) {
      await admin.rpc("set_generation_status", {
        p_generation_id: generation_id,
        p_status: "failed",
        p_error: "Failed to store any images",
      });
      const cc6 = (gen.params as Record<string, unknown>)?.cost_credits;
      if (cc6 && Number(cc6) > 0) { try { await admin.rpc("refund_credits", { p_amount: Number(cc6), p_ref_type: "image", p_ref_id: generation_id, p_note: "Upload failed" }); } catch (_) {} }
      return json({ ok: false, error_code: "UPLOAD_FAILED", message: "Failed to store images" }, 500);
    }

    // Update generation as succeeded
    await admin.rpc("set_generation_status", {
      p_generation_id: generation_id,
      p_status: "succeeded",
      p_result_images: JSON.stringify(resultImages),
    });

    // Charge reserved credits on success
    const ccSuccess = (gen.params as Record<string, unknown>)?.cost_credits;
    if (ccSuccess && Number(ccSuccess) > 0) {
      try { await admin.rpc("charge_reserved", { p_ref_type: "image", p_ref_id: generation_id, p_amount: Number(ccSuccess) }); } catch (e) { console.warn("[qwen-generate] charge_reserved failed:", e); }
    }

    console.log("[qwen-generate] Success:", resultImages.length, "images for generation:", generation_id);

    return json({
      ok: true,
      generation_id,
      images: resultImages,
    });
  } catch (e) {
    console.error("[qwen-generate] error:", e);
    return json({ ok: false, error_code: "INTERNAL", message: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
