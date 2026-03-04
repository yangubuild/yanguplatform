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

function getProviderDebugCounts(providerKey: string, count: number) {
  const debug = { cj: 0, modern: 0, yangu: 0 };
  if (providerKey === "cj") debug.cj = count;
  if (providerKey === "moderndropship") debug.modern = count;
  if (providerKey === "estores" || providerKey === "yangu_estores") debug.yangu = count;
  return debug;
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
    const provider_key = typeof body?.provider_key === "string" ? body.provider_key.trim().toLowerCase() : "";
    const query = body?.query;
    const filters = body?.filters ?? {};
    const shop_surface_id = body?.shop_surface_id;

    if (!provider_key) {
      return errResponse("BAD_REQUEST", "provider_key is required");
    }
    if (!query || typeof query !== "string") {
      return errResponse("BAD_REQUEST", "query is required");
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

    let items: any[] = [];
    let warnings: string[] = [];

    try {
      items = await adapter.searchProducts(query, filters);
    } catch (providerErr: any) {
      const err = providerErr instanceof Error ? providerErr : new Error(String(providerErr));
      const isModernConfigMissing =
        provider_key === "moderndropship" &&
        (providerErr?.code === "MODERNDROPSHIP_CONFIG_MISSING" || String(err.message).toLowerCase().includes("missing api key"));

      if (isModernConfigMissing) {
        warnings = ["ModernDropship not configured (missing API key)"];
        return new Response(
          JSON.stringify({
            provider_key,
            items: [],
            warnings,
            debug: getProviderDebugCounts(provider_key, 0),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.error("dropship-search provider error", {
        provider_key,
        query,
        message: err.message,
        stack: err.stack || "no stack",
      });
      return errResponse("UPSTREAM_ERROR", err.message || "Unknown upstream error", 502);
    }

    if (provider_key === "moderndropship" && items.length === 0) {
      warnings.push("ModernDropship returned 0 products for this account");
    }

    let displayCurrency: string | null = null;
    let fxRate: number | null = null;
    let fxAsOf: string | null = null;

    if (shop_surface_id) {
      try {
        displayCurrency = await getDisplayCurrencyForShop(shop_surface_id);
        const providerCurrency = items[0]?.currency || "USD";
        const fx = await getFxRate(providerCurrency, displayCurrency);
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

    const enrichedItems = items.map((item) => {
      const providerCurrency = item.currency || "USD";
      const providerMinCents = toCents(item.min_price);
      const providerMaxCents = toCents(item.max_price);

      const result: Record<string, unknown> = {
        ...item,
        provider_currency: providerCurrency,
        provider_min_price_cents: providerMinCents,
        provider_max_price_cents: providerMaxCents,
        category_name: item.category_name || null,
        ship_from_country: item.ship_from_country || null,
      };

      if (displayCurrency && fxRate != null) {
        result.display_currency = displayCurrency;
        result.display_min_price_cents = decimalToDisplayCents(item.min_price, fxRate);
        result.display_max_price_cents = decimalToDisplayCents(item.max_price, fxRate);
        result.fx_rate_used = fxRate;
      }

      return result;
    });

    return new Response(JSON.stringify({
      provider_key,
      items: enrichedItems,
      debug: getProviderDebugCounts(provider_key, enrichedItems.length),
      ...(warnings.length > 0 ? { warnings } : {}),
      ...(displayCurrency ? { display_currency: displayCurrency, fx_rate: fxRate, fx_as_of: fxAsOf } : {}),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("dropship-search error:", {
      message: err.message,
      stack: err.stack || "no stack",
      provider_key: (() => { try { return "see body"; } catch { return "unknown"; } })(),
    });
    const msg = err.message || "Unknown error";
    return errResponse("UPSTREAM_ERROR", msg, 502);
  }
});
