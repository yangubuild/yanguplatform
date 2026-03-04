import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAdapter } from "../_shared/dropship/providerRegistry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // 1. Grab a batch of queued jobs
    const { data: jobs, error: batchErr } = await supabase.rpc("process_dropship_sync_batch", { p_limit: 25 });

    if (batchErr) {
      console.error("process_dropship_sync_batch error:", batchErr);
      return new Response(JSON.stringify({ error: batchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jobList = Array.isArray(jobs) ? jobs : (typeof jobs === "string" ? JSON.parse(jobs) : []);

    if (jobList.length === 0) {
      return new Response(JSON.stringify({ status: "ok", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let successCount = 0;
    let failCount = 0;

    // 2. Process each job
    for (const job of jobList) {
      const adapter = getAdapter(job.provider_key);

      if (!adapter) {
        await supabase.rpc("complete_dropship_sync_job", {
          p_job_id: job.id,
          p_success: false,
          p_error: `Provider not found: ${job.provider_key}`,
          p_new_snapshot: null,
        });
        failCount++;
        continue;
      }

      try {
        const product = await adapter.getProduct(job.external_product_id);

        const snapshot = {
          variants: product.variants.map((v) => ({
            external_variant_id: v.external_variant_id,
            name: v.name,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
          })),
        };

        await supabase.rpc("complete_dropship_sync_job", {
          p_job_id: job.id,
          p_success: true,
          p_error: null,
          p_new_snapshot: snapshot,
        });
        successCount++;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const is429 = errMsg.includes("429") || errMsg.toLowerCase().includes("rate");

        await supabase.rpc("complete_dropship_sync_job", {
          p_job_id: job.id,
          p_success: false,
          p_error: errMsg,
          p_new_snapshot: null,
        });
        failCount++;

        // If rate limited, set provider cooldown and stop batch
        if (is429) {
          console.warn(`Rate limited by ${job.provider_key}, setting 15min cooldown`);
          await supabase.rpc("set_dropship_provider_cooldown", {
            p_provider_key: job.provider_key,
            p_minutes: 15,
          });
          break;
        }
      }
    }

    return new Response(
      JSON.stringify({ status: "ok", processed: successCount + failCount, success: successCount, failed: failCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("sync-inventory fatal:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
