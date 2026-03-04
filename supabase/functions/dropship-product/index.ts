import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAdapter } from "../_shared/dropship/providerRegistry.ts";
import { getDisplayCurrencyForShop, getFxRate, decimalToDisplayCents } from "../_shared/dropship/fx.ts";
import { toCents } from "../_shared/dropship/normalize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const request_id = crypto.randomUUID();

  // Safe body parse
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ request_id, error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, 400);
  }

  const { provider_key, external_product_id, shop_surface_id } = body as {
    provider_key?: string;
    external_product_id?: string;
    shop_surface_id?: string;
  };

  // Validate required fields
  if (!provider_key || typeof provider_key !== "string") {
    return jsonResponse({ request_id, error: { code: "BAD_REQUEST", message: "provider_key is required (cj | moderndropship | estores)" } }, 400);
  }
  if (!external_product_id || typeof external_product_id !== "string") {
    return jsonResponse({ request_id, error: { code: "BAD_REQUEST", message: "external_product_id is required" } }, 400);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ request_id, error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" } }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return jsonResponse({ request_id, error: { code: "UNAUTHORIZED", message: "Auth failed" } }, 401);
    }

    // Check provider exists and is enabled
    const { data: provider, error: provErr } = await supabase
      .from("dropship_providers")
      .select("provider_key, is_enabled")
      .eq("provider_key", provider_key)
      .single();

    if (provErr || !provider) {
      return jsonResponse({ request_id, error: { code: "PROVIDER_NOT_FOUND", message: `Provider '${provider_key}' not found` } }, 404);
    }
    if (!provider.is_enabled) {
      return jsonResponse({ request_id, error: { code: "PROVIDER_DISABLED", message: `Provider '${provider_key}' is disabled` } }, 400);
    }

    const adapter = getAdapter(provider_key);
    if (!adapter) {
      return jsonResponse({ request_id, error: { code: "PROVIDER_NOT_FOUND", message: `No adapter for '${provider_key}'` } }, 400);
    }

    // Fetch product from provider
    let product: Awaited<ReturnType<typeof adapter.getProduct>>;
    try {
      product = await adapter.getProduct(external_product_id);
    } catch (upstreamErr: any) {
      const msg = upstreamErr?.message ?? "Unknown upstream error";
      const stack = upstreamErr?.stack ?? "no stack";
      console.error(upstreamErr?.stack || upstreamErr);
      return jsonResponse({
        request_id,
        error: {
          code: "UPSTREAM_PROVIDER_ERROR",
          provider_key,
          message: msg,
          details: String(stack).slice(0, 2000),
        },
      }, 500);
    }

    // --- Currency conversion ---
    let displayCurrency: string | null = null;
    let fxRate: number | null = null;
    let fxAsOf: string | null = null;

    if (shop_surface_id) {
      try {
        displayCurrency = await getDisplayCurrencyForShop(shop_surface_id);
        const fx = await getFxRate(product.currency, displayCurrency);
        fxRate = fx.rate;
        fxAsOf = fx.as_of;
      } catch (e: any) {
        if (e.code === "FX_RATE_MISSING") {
          displayCurrency = null;
        } else {
          console.error("dropship-product FX_ERROR", { request_id, message: e?.message, stack: e?.stack });
          // Non-fatal: continue without FX
          displayCurrency = null;
        }
      }
    }

    const providerCurrency = product.currency || "USD";

    const enrichedVariants = (product.variants || []).map((v) => {
      const provPriceCents = toCents(v.price);
      const variant: Record<string, unknown> = {
        ...v,
        provider_currency: providerCurrency,
        provider_price_cents: provPriceCents,
      };
      if (displayCurrency && fxRate != null) {
        variant.display_currency = displayCurrency;
        variant.display_price_cents = decimalToDisplayCents(v.price, fxRate);
      }
      return variant;
    });

    const result: Record<string, unknown> = {
      ...product,
      provider_currency: providerCurrency,
      provider_base_price_cents: toCents(product.base_price),
      variants: enrichedVariants,
    };

    if (displayCurrency && fxRate != null) {
      result.display_currency = displayCurrency;
      result.display_base_price_cents = decimalToDisplayCents(product.base_price, fxRate);
      result.fx_rate_used = fxRate;
      result.fx_as_of = fxAsOf;
    }

    return jsonResponse({ request_id, provider_key, product: result });
  } catch (err: any) {
    const msg = err?.message ?? "Unknown error";
    const stack = err?.stack ?? "no stack";
    console.error(err?.stack || err);
    return jsonResponse({
      request_id,
      error: {
        code: "UPSTREAM_ERROR",
        message: msg,
        details: String(stack).slice(0, 2000),
      },
    }, 500);
  }
});
