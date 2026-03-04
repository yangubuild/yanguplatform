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

function normalizeProviderKey(providerKey: string) {
  const key = providerKey.trim().toLowerCase();
  return key === "yangu_estores" ? "estores" : key;
}

function getProviderDebugCounts(providerKey: string, count: number) {
  const debug = { cj: 0, modern: 0, yangu: 0 };
  if (providerKey === "cj") debug.cj = count;
  if (providerKey === "moderndropship") debug.modern = count;
  if (providerKey === "estores") debug.yangu = count;
  return debug;
}

async function searchEstoresProducts(supabase: any, userId: string, query: string) {
  const { data: memberships } = await supabase
    .from("org_memberships")
    .select("org_id")
    .eq("user_id", userId);

  const orgIds = (memberships || []).map((m: any) => m.org_id).filter(Boolean);
  if (orgIds.length === 0) return [];

  const { data: surfaces } = await supabase
    .from("surfaces")
    .select("id")
    .in("org_id", orgIds)
    .eq("surface_type", "shop")
    .is("archived_at", null);

  const surfaceIds = (surfaces || []).map((s: any) => s.id).filter(Boolean);
  if (surfaceIds.length === 0) return [];

  let dbQuery = supabase
    .from("dropship_imports")
    .select("external_product_id,title,images,provider_currency,provider_price_cents,display_currency,display_price_cents,raw")
    .in("shop_surface_id", surfaceIds)
    .order("created_at", { ascending: false })
    .limit(20);

  const q = query.trim();
  if (q && q.toLowerCase() !== "trending best sellers") {
    dbQuery = dbQuery.ilike("title", `%${q}%`);
  }

  const { data: rows, error } = await dbQuery;
  if (error) throw error;

  return (rows || []).map((row: any) => {
    const raw = row.raw || {};
    const images = Array.isArray(row.images) ? row.images.filter((i: unknown) => typeof i === "string") : [];
    const providerPriceCents = Number(row.provider_price_cents || 0);
    const price = providerPriceCents > 0 ? providerPriceCents / 100 : 0;

    return {
      external_product_id: String(row.external_product_id || ""),
      title: String(row.title || "Untitled product"),
      thumbnail_url: images[0] || null,
      image_urls: images,
      currency: String(row.provider_currency || "USD"),
      min_price: price,
      max_price: price,
      stock_hint: "unknown",
      category_name: raw?.category_name || raw?.categoryName || null,
      ship_from_country: raw?.ship_from_country || raw?.shipFromCountry || null,
      raw,
    };
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
    const rawProviderKey = typeof body?.provider_key === "string" ? normalizeProviderKey(body.provider_key) : "";
    const providerKeys = Array.isArray(body?.provider_keys)
      ? Array.from(new Set(body.provider_keys.filter((p: unknown) => typeof p === "string").map((p: string) => normalizeProviderKey(p))))
      : [];
    const enableMultiProvider = body?.enable_multi_provider === true;

    let provider_key = rawProviderKey;
    if (!provider_key && providerKeys.length === 1) provider_key = providerKeys[0];

    if (!provider_key && providerKeys.length > 1) {
      if (!enableMultiProvider) {
        return errResponse("BAD_REQUEST", "provider_keys requires enable_multi_provider=true");
      }
      return errResponse("BAD_REQUEST", "Multi-provider mode is disabled for this view; use provider_key", 400);
    }

    if (!provider_key) {
      return errResponse("BAD_REQUEST", "provider_key or provider_keys is required");
    }

    const query = typeof body?.query === "string" ? body.query : "";
    const filters = body?.filters ?? {};
    const shop_surface_id = body?.shop_surface_id;

    let items: any[] = [];
    const warnings: string[] = [];

    if (provider_key === "estores") {
      items = await searchEstoresProducts(supabase, user.id, query || "trending best sellers");
    } else {
      const { data: provider, error: provErr } = await supabase
        .from("dropship_providers")
        .select("provider_key, is_enabled")
        .eq("provider_key", provider_key)
        .single();

      if (provErr || !provider) return errResponse("PROVIDER_NOT_FOUND", `Provider '${provider_key}' not found`);
      if (!provider.is_enabled) return errResponse("PROVIDER_DISABLED", `Provider '${provider_key}' is disabled`);

      const adapter = getAdapter(provider_key);
      if (!adapter) return errResponse("PROVIDER_NOT_FOUND", `No adapter for '${provider_key}'`);

      try {
        items = await adapter.searchProducts(query || "trending best sellers", filters);
      } catch (providerErr: any) {
        const err = providerErr instanceof Error ? providerErr : new Error(String(providerErr));
        const isModernConfigMissing =
          provider_key === "moderndropship" &&
          (providerErr?.code === "MODERNDROPSHIP_CONFIG_MISSING" || String(err.message).toLowerCase().includes("missing api key"));

        if (isModernConfigMissing) {
          warnings.push("ModernDropship not configured (missing API key)");
          return new Response(
            JSON.stringify({ provider_key, items: [], warnings, debug: getProviderDebugCounts(provider_key, 0) }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.error("dropship-search provider error", { provider_key, query, message: err.message, stack: err.stack || "no stack" });
        return errResponse("UPSTREAM_ERROR", err.message || "Unknown upstream error", 502);
      }
    }

    if (provider_key === "moderndropship" && items.length === 0) {
      warnings.push("No ModernDropship products available for this account.");
    }

    let displayCurrency: string | null = null;
    let fxRate: number | null = null;
    let fxAsOf: string | null = null;

    if (shop_surface_id && items.length > 0) {
      try {
        displayCurrency = await getDisplayCurrencyForShop(shop_surface_id);
        const providerCurrency = items[0]?.currency || "USD";
        const fx = await getFxRate(providerCurrency, displayCurrency);
        fxRate = fx.rate;
        fxAsOf = fx.as_of;
      } catch {
        displayCurrency = null;
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
  } catch (e: any) {
    console.error(e?.stack || e);
    return errResponse("UPSTREAM_ERROR", e?.message || "Unknown error", 500);
  }
});
