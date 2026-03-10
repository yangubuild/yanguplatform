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

function truncate(s: string, max = 800): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 2,
): Promise<Response> {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || (res.status !== 429 && res.status < 500)) return res;
      // Retryable status
      if (attempt < retries) {
        const delay = 1000 * Math.pow(2, attempt); // 1s, 2s
        console.warn(`[qwen-generate] Retryable ${res.status}, attempt ${attempt + 1}, waiting ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      return res; // last attempt, return as-is
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (attempt < retries) {
        const delay = 1000 * Math.pow(2, attempt);
        console.warn(`[qwen-generate] Fetch error, attempt ${attempt + 1}, waiting ${delay}ms:`, lastErr.message);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr ?? new Error("fetchWithRetry exhausted");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Health-check ping
    const url = new URL(req.url);
    if (url.searchParams.get("ping") === "1") {
      return json({ ok: true, provider: "qwen" });
    }

    // --- Validate env vars ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const qwenKey = Deno.env.get("QWEN_API_KEY");

    if (!supabaseUrl || !serviceKey) {
      return json({ ok: false, error_code: "QWEN_MISCONFIG", message: "Missing env var: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, 500);
    }
    if (!qwenKey) {
      return json({ ok: false, error_code: "QWEN_MISCONFIG", message: "Missing env var: QWEN_API_KEY" }, 500);
    }

    // --- Auth (verified via Supabase Auth) ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ ok: false, error_code: "AUTH_REQUIRED", message: "Authentication required" }, 401);
    }
    const userClient = createClient(supabaseUrl!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !authUser) {
      return json({ ok: false, error_code: "AUTH_REQUIRED", message: "Authentication required" }, 401);
    }
    const userId: string = authUser.id;

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
    if (gen.user_id !== userId) return json({ ok: false, error_code: "FORBIDDEN", message: "Not your generation" }, 403);
    if (gen.status !== "queued") return json({ ok: false, error_code: "ALREADY_PROCESSING", message: `Status is already ${gen.status}` }, 409);

    // Set processing
    await admin.rpc("set_generation_status", { p_generation_id: generation_id, p_status: "processing" });

    // --- Build Qwen request ---
    const qwenParams = gen.params || {};
    const model = qwenParams.model || "wanx-v1";
    const size = qwenParams.size || "1024*1024";

    const qwenBody = {
      model,
      input: {
        prompt: gen.prompt,
        ...(qwenParams.negative_prompt ? { negative_prompt: qwenParams.negative_prompt } : {}),
      },
      parameters: {
        n: 1,
        size,
        ...(qwenParams.style ? { style: qwenParams.style } : {}),
      },
    };

    console.log(`[qwen-generate] Submitting: gen=${generation_id} model=${model} size=${size} prompt_len=${gen.prompt?.length ?? 0} user=${userId}`);

    const qwenEndpoint = Deno.env.get("QWEN_BASE_URL") || "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";

    // Helper to refund credits on failure
    const refundIfNeeded = async () => {
      const cc = (gen.params as Record<string, unknown>)?.cost_credits;
      if (cc && Number(cc) > 0) {
        try { await admin.rpc("refund_credits", { p_amount: Number(cc), p_ref_type: "image", p_ref_id: generation_id, p_note: "Qwen generation failed" }); } catch (_) { /* best effort */ }
      }
    };

    const failGeneration = async (error: string) => {
      await admin.rpc("set_generation_status", { p_generation_id: generation_id, p_status: "failed", p_error: error });
      await refundIfNeeded();
    };

    // Step 1: Submit async task (with retry)
    let submitRes: Response;
    try {
      submitRes = await fetchWithRetry(qwenEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${qwenKey}`,
          "Content-Type": "application/json",
          "X-DashScope-Async": "enable",
        },
        body: JSON.stringify(qwenBody),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[qwen-generate] Submit fetch failed after retries: ${msg}`);
      await failGeneration(`Qwen fetch failed: ${msg}`);
      return json({ ok: false, error_code: "QWEN_UPSTREAM_ERROR", message: "Failed to reach Qwen API", details: { error: msg } }, 502);
    }

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      console.error(`[qwen-generate] Qwen submit error: status=${submitRes.status} body=${truncate(errText)}`);
      await failGeneration(`Qwen API error: ${submitRes.status}`);
      return json({
        ok: false,
        error_code: "QWEN_UPSTREAM_ERROR",
        message: `Upstream returned ${submitRes.status}`,
        details: { status: submitRes.status, body_preview: truncate(errText) },
      }, 502);
    }

    const submitData = await submitRes.json();
    const taskId = submitData.output?.task_id;

    if (!taskId) {
      console.error(`[qwen-generate] No task_id in response: ${truncate(JSON.stringify(submitData))}`);
      await failGeneration("No task_id returned from Qwen");
      return json({ ok: false, error_code: "QWEN_UPSTREAM_ERROR", message: "No task ID returned", details: { body_preview: truncate(JSON.stringify(submitData)) } }, 502);
    }

    console.log(`[qwen-generate] Task submitted: ${taskId}`);

    // Step 2: Poll for completion (max ~60s)
    const pollUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
    let taskResult: Record<string, unknown> | null = null;

    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise((r) => setTimeout(r, 2000));

      let pollRes: Response;
      try {
        pollRes = await fetch(pollUrl, {
          headers: { "Authorization": `Bearer ${qwenKey}` },
        });
      } catch (e) {
        console.warn(`[qwen-generate] Poll fetch error attempt ${attempt}:`, e instanceof Error ? e.message : e);
        continue;
      }

      if (!pollRes.ok) {
        const t = await pollRes.text();
        console.warn(`[qwen-generate] Poll HTTP ${pollRes.status}: ${truncate(t)}`);
        continue;
      }

      const pollData = await pollRes.json();
      const status = pollData.output?.task_status;

      if (status === "SUCCEEDED") {
        taskResult = pollData;
        break;
      } else if (status === "FAILED") {
        const errMsg = pollData.output?.message || "Task failed";
        console.error(`[qwen-generate] Task failed: ${errMsg}`);
        await failGeneration(`Qwen task failed: ${errMsg}`);
        return json({ ok: false, error_code: "QWEN_TASK_FAILED", message: errMsg }, 502);
      }
      // PENDING / RUNNING → keep polling
    }

    if (!taskResult) {
      await failGeneration("Qwen task timed out after 60s");
      return json({ ok: false, error_code: "TIMEOUT", message: "Image generation timed out" }, 504);
    }

    // Extract images
    const results = (taskResult as Record<string, unknown>).output as Record<string, unknown>;
    const rawImages = (results.results || []) as { url?: string }[];

    if (rawImages.length === 0) {
      await failGeneration("No images returned from Qwen");
      return json({ ok: false, error_code: "NO_IMAGES", message: "No images returned" }, 502);
    }

    // Download and upload each image
    const resultImages: { url: string; storage_path: string; is_image_safe: boolean; seed: number }[] = [];

    for (let i = 0; i < rawImages.length; i++) {
      const imageUrl = rawImages[i].url;
      if (!imageUrl) continue;

      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        console.error(`[qwen-generate] Failed to download image ${i}: ${imgRes.status}`);
        continue;
      }
      const imgBytes = new Uint8Array(await imgRes.arrayBuffer());

      const storagePath = `qwen/${userId}/${generation_id}/${i}.png`;
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
      await failGeneration("Failed to store any images");
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

    console.log(`[qwen-generate] Success: ${resultImages.length} images for gen=${generation_id}`);

    return json({
      ok: true,
      generation_id,
      images: resultImages,
    });
  } catch (e) {
    console.error("[qwen-generate] Unhandled error:", e);
    return json({ ok: false, error_code: "INTERNAL", message: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
