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
    const { provider_key, external_product_id, shop_surface_id } = body;

    if (!provider_key || typeof provider_key !== "string") {
      return errResponse("BAD_REQUEST", "provider_key is required");
    }
    if (!external_product_id || typeof external_product_id !== "string") {
      return errResponse("BAD_REQUEST", "external_product_id is required");
    }

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

    const product = await adapter.getProduct(external_product_id);

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
          throw e;
        }
      }
    }

    const providerCurrency = product.currency || "USD";

    const enrichedVariants = product.variants.map((v) => {
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

    return new Response(JSON.stringify({ provider_key, product: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("dropship-product error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return errResponse("UPSTREAM_ERROR", msg, 502);
  }
});
