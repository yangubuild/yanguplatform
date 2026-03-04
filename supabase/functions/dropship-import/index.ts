import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAdapter } from "../_shared/dropship/providerRegistry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function errResponse(code: string, message: string, status = 400) {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errResponse("BAD_REQUEST", "Unauthorized", 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errResponse("BAD_REQUEST", "Unauthorized", 401);

    const body = await req.json();
    const { provider_key, external_product_id, shop_surface_id } = body;

    if (!provider_key || typeof provider_key !== "string") {
      return errResponse("BAD_REQUEST", "provider_key is required");
    }
    if (!external_product_id || typeof external_product_id !== "string") {
      return errResponse("BAD_REQUEST", "external_product_id is required");
    }
    if (!shop_surface_id || typeof shop_surface_id !== "string") {
      return errResponse("BAD_REQUEST", "shop_surface_id is required");
    }

    // Verify provider is enabled
    const { data: provider, error: provErr } = await supabase
      .from("dropship_providers")
      .select("provider_key, is_enabled")
      .eq("provider_key", provider_key)
      .single();

    if (provErr || !provider) {
      return errResponse("PROVIDER_NOT_FOUND", `Provider '${provider_key}' not found`);
    }
    if (!provider.is_enabled) {
      return errResponse("PROVIDER_DISABLED", `Provider '${provider_key}' is disabled`);
    }

    const adapter = getAdapter(provider_key);
    if (!adapter) {
      return errResponse("PROVIDER_NOT_FOUND", `No adapter for '${provider_key}'`);
    }

    // Fetch product from upstream
    const product = await adapter.getProduct(external_product_id);

    // Import via RPC
    const { data: importResult, error: rpcErr } = await supabase.rpc(
      "import_external_product_to_shop",
      {
        p_provider_key: provider_key,
        p_external_product_id: external_product_id,
        p_shop_surface_id: shop_surface_id,
        p_title: product.title,
        p_images: JSON.stringify(product.images || []),
        p_variants: JSON.stringify(product.variants || []),
        p_raw: JSON.stringify(product.raw || {}),
      }
    );

    if (rpcErr) {
      console.error("import RPC error:", rpcErr);
      return errResponse("UPSTREAM_ERROR", rpcErr.message, 500);
    }

    return new Response(JSON.stringify({ provider_key, import: importResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("dropship-import error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return errResponse("UPSTREAM_ERROR", msg, 502);
  }
});
