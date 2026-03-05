import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAdapter } from "../_shared/dropship/providerRegistry.ts";
import { getDisplayCurrencyForShop, getFxRate, decimalToDisplayCents } from "../_shared/dropship/fx.ts";
import { toCents } from "../_shared/dropship/normalize.ts";

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
    const {
      provider_key,
      external_product_id,
      shop_surface_id,
      // Frontend can pass pricing from search results as fallback
      fallback_title,
      fallback_price,
      fallback_currency,
      fallback_images,
      markup_percent,
      selling_price_cents,
    } = body;

    if (!provider_key || typeof provider_key !== "string") {
      return errResponse("BAD_REQUEST", "provider_key is required");
    }
    if (!external_product_id || typeof external_product_id !== "string") {
      return errResponse("BAD_REQUEST", "external_product_id is required");
    }
    if (!shop_surface_id || typeof shop_surface_id !== "string") {
      return errResponse("BAD_REQUEST", "shop_surface_id is required");
    }

    // Verify provider
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

    // Fetch product from upstream - use fallback if getProduct returns stub data
    let product: any;
    try {
      product = await adapter.getProduct(external_product_id);
    } catch (e) {
      console.warn("getProduct failed, using fallback:", e);
      product = null;
    }

    // Determine if upstream product data is usable (has a real price)
    const upstreamHasPrice = product && product.base_price > 0;

    // Use fallback pricing from frontend search results if upstream is stub/zero
    const effectiveTitle = (upstreamHasPrice ? product.title : null) || fallback_title || `${provider_key} product`;
    const effectiveImages = (upstreamHasPrice && product.images?.length > 0) ? product.images : (fallback_images || []);
    const effectiveBasePrice = upstreamHasPrice ? product.base_price : (fallback_price || 0);
    const effectiveCurrency = (upstreamHasPrice ? product.currency : null) || fallback_currency || "USD";
    const effectiveVariants = (upstreamHasPrice ? product.variants : null) || [];
    const effectiveRaw = product?.raw || {};

    // Resolve display currency + FX rate
    const providerCurrency = effectiveCurrency;
    const providerPriceCents = typeof effectiveBasePrice === "number" && effectiveBasePrice > 0 && effectiveBasePrice < 100
      ? toCents(effectiveBasePrice)  // decimal like 2.27
      : (typeof effectiveBasePrice === "number" && effectiveBasePrice >= 100 ? effectiveBasePrice : toCents(effectiveBasePrice)); // already cents or decimal
    
    let displayCurrency = providerCurrency;
    let displayPriceCents = providerPriceCents;
    let fxRate = 1;
    let fxTimestamp = new Date().toISOString();

    try {
      displayCurrency = await getDisplayCurrencyForShop(shop_surface_id);
      const fx = await getFxRate(providerCurrency, displayCurrency);
      fxRate = fx.rate;
      fxTimestamp = fx.as_of;
      displayPriceCents = decimalToDisplayCents(effectiveBasePrice, fxRate);
    } catch (e: any) {
      if (e.code !== "FX_RATE_MISSING") throw e;
      displayCurrency = providerCurrency;
      displayPriceCents = providerPriceCents;
    }

    // If frontend provided selling_price_cents, use that as display price
    if (selling_price_cents && typeof selling_price_cents === "number" && selling_price_cents > 0) {
      displayPriceCents = selling_price_cents;
    }

    // Enrich variants with currency data
    const enrichedVariants = (effectiveVariants || []).map((v: any) => ({
      ...v,
      provider_currency: providerCurrency,
      provider_price_cents: toCents(v.price),
      display_currency: displayCurrency,
      display_price_cents: decimalToDisplayCents(v.price, fxRate),
    }));

    // Import via RPC
    const { data: importResult, error: rpcErr } = await supabase.rpc(
      "import_external_product_to_shop",
      {
        p_provider_key: provider_key,
        p_external_product_id: external_product_id,
        p_shop_surface_id: shop_surface_id,
        p_title: effectiveTitle,
        p_images: JSON.stringify(effectiveImages),
        p_variants: JSON.stringify(enrichedVariants),
        p_raw: JSON.stringify(effectiveRaw),
        p_provider_currency: providerCurrency,
        p_provider_price_cents: providerPriceCents,
        p_display_currency: displayCurrency,
        p_display_price_cents: displayPriceCents,
        p_fx_rate: fxRate,
        p_fx_rate_timestamp: fxTimestamp,
      }
    );

    if (rpcErr) {
      console.error("import RPC error:", rpcErr);
      return errResponse("UPSTREAM_ERROR", rpcErr.message, 500);
    }

    const result = {
      ok: true,
      provider_key,
      import: importResult,
      destination_surface_id: shop_surface_id,
      created_import_id: (importResult as any)?.id || null,
      provider_price_cents: providerPriceCents,
      display_price_cents: displayPriceCents,
      markup_percent: markup_percent || 30,
    };

    console.log("Import success:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("dropship-import error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return errResponse("UPSTREAM_ERROR", msg, 502);
  }
});
