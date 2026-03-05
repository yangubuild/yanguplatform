import type {
  DropshipAdapter,
  DropshipSearchItem,
  DropshipProductDetail,
  SearchFilters,
  CreateOrderResult,
  OrderStatusResult,
} from "./types.ts";

// ─── Config ─────────────────────────────────────────────────────────────
const BASE_URL = "https://api-sg.aliexpress.com/sync";
const APP_KEY = "528918";
const CACHE_TTL_MS = 120_000; // 2 minutes
const MIN_CALL_INTERVAL_MS = 2_000; // throttle: 1 call per 2s

// ─── In-memory cache + throttle ─────────────────────────────────────────
interface CacheEntry { items: DropshipSearchItem[]; ts: number }
const _cache = new Map<string, CacheEntry>();
let _lastCallTs = 0;

// ─── Diagnostics (dev) ─────────────────────────────────────────────────
let _lastDiag: Record<string, unknown> | null = null;
export function getLastAliexpressDiagnostics() { return _lastDiag; }

function getCached(key: string): CacheEntry | null {
  const e = _cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL_MS) { _cache.delete(key); return null; }
  return e;
}

// ─── AliExpress HMAC-SHA256 signature ───────────────────────────────────
async function sign(
  params: Record<string, string>,
  apiMethod: string,
  appSecret: string,
): Promise<string> {
  // AliExpress signature format:
  // 1. Sort params alphabetically by key
  // 2. Concatenate: appSecret + apiMethod + key1value1key2value2... + appSecret
  // 3. HMAC-SHA256(appSecret, concatenated) → uppercase hex
  const sortedKeys = Object.keys(params).sort();
  let signStr = appSecret + apiMethod;
  for (const k of sortedKeys) {
    signStr += k + params[k];
  }
  signStr += appSecret;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(signStr));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

// ─── Build signed URL ───────────────────────────────────────────────────
async function buildSignedUrl(
  apiMethod: string,
  bizParams: Record<string, string>,
): Promise<string> {
  const appSecret = Deno.env.get("ALIEXPRESS_APP_SECRET");
  if (!appSecret) {
    const err: any = new Error("AliExpress APP_SECRET not configured");
    err.code = "ALIEXPRESS_CONFIG_MISSING";
    throw err;
  }

  const timestamp = String(Date.now());
  const sysParams: Record<string, string> = {
    app_key: APP_KEY,
    method: apiMethod,
    timestamp,
    sign_method: "sha256",
    v: "2.0",
    format: "json",
  };

  // Merge sys + biz for signature
  const allParams = { ...sysParams, ...bizParams };
  const signature = await sign(allParams, apiMethod, appSecret);

  const qs = new URLSearchParams({ ...allParams, sign: signature });
  return `${BASE_URL}?${qs.toString()}`;
}

// ─── Generic fetch with throttle ────────────────────────────────────────
async function callAliexpress(
  apiMethod: string,
  bizParams: Record<string, string>,
): Promise<any> {
  const now = Date.now();
  if (now - _lastCallTs < MIN_CALL_INTERVAL_MS) {
    const err: any = new Error("AliExpress rate limited (throttle)");
    err.code = "RATE_LIMITED";
    err.status = 429;
    throw err;
  }
  _lastCallTs = now;

  const url = await buildSignedUrl(apiMethod, bizParams);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  const requestId = crypto.randomUUID();
  const redactedUrl = url.replace(/sign=[A-F0-9]+/, "sign=REDACTED")
    .replace(/app_key=\d+/, "app_key=***");

  try {
    const res = await fetch(url, { signal: controller.signal });
    const text = await res.text();

    _lastDiag = {
      request_id: requestId,
      provider_http_status: res.status,
      provider_url: redactedUrl,
      provider_query_params: bizParams,
      provider_auth_header_used: "query_param_sign (HMAC-SHA256)",
      provider_response_preview: text.slice(0, 500),
      timestamp: new Date().toISOString(),
    };

    console.log("[AliExpress Diagnostics]", JSON.stringify(_lastDiag));

    if (!res.ok) {
      const err: any = new Error(`AliExpress HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }

    const json = JSON.parse(text);

    // Check for AliExpress-level error
    const errResp = json?.error_response;
    if (errResp) {
      console.error("[AliExpress API Error]", JSON.stringify(errResp));
      const err: any = new Error(errResp.msg || errResp.sub_msg || "AliExpress API error");
      err.code = errResp.code;
      err.status = errResp.code === "27" ? 403 : 400;
      throw err;
    }

    return json;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Normalize search result ────────────────────────────────────────────
function normalizeSearchItem(item: any): DropshipSearchItem {
  const images: string[] = [];
  if (item.product_main_image_url) images.push(item.product_main_image_url);
  if (item.product_small_image_urls?.string) {
    for (const u of item.product_small_image_urls.string) {
      if (typeof u === "string" && !images.includes(u)) images.push(u);
    }
  }

  const price = parseFloat(item.target_sale_price || item.target_original_price || "0");
  const origPrice = parseFloat(item.target_original_price || item.target_sale_price || "0");
  const currency = item.target_sale_price_currency || item.target_original_price_currency || "USD";

  return {
    external_product_id: String(item.product_id || ""),
    title: String(item.product_title || "Untitled"),
    thumbnail_url: item.product_main_image_url || null,
    image_urls: images,
    currency,
    min_price: price,
    max_price: origPrice > price ? origPrice : price,
    stock_hint: "unknown",
    category_name: null,
    ship_from_country: item.ship_to_days ? "CN" : null, // AliExpress default
    raw: item,
  };
}

// ─── Adapter implementation ─────────────────────────────────────────────
export const aliexpressAdapter: DropshipAdapter = {
  async searchProducts(query: string, filters: SearchFilters & { bypass_cache?: boolean }): Promise<DropshipSearchItem[]> {
    const keyword = query || "trending best sellers";
    const page = "1";
    const pageSize = "20";
    const shipTo = (filters as any)?.country || "US";

    const cacheKey = `ae:${keyword}:${shipTo}:${page}`;
    const bypassCache = filters?.bypass_cache === true;

    if (bypassCache) {
      _cache.delete(cacheKey);
    } else {
      const cached = getCached(cacheKey);
      if (cached) {
        console.log("[AliExpress] cache hit", cacheKey);
        return cached.items;
      }
    }

    const bizParams: Record<string, string> = {
      keyword,
      page_no: page,
      page_size: pageSize,
      target_currency: "USD",
      target_language: "EN",
      ship_to_country: shipTo,
      sort: "SALE_PRICE_ASC",
    };

    const json = await callAliexpress("aliexpress.ds.text.search", bizParams);

    // Extract items from AliExpress response structure
    const respKey = "aliexpress_ds_text_search_response";
    const result = json?.[respKey]?.data || json?.[respKey]?.resp_result?.result || json?.result;
    const products = result?.products?.product || result?.products || [];

    const items = (Array.isArray(products) ? products : []).map(normalizeSearchItem);

    // Debug logging
    console.log(`[AliExpress] search returned ${items.length} items, ship_from: ${items[0]?.ship_from_country || "N/A"}`);

    _cache.set(cacheKey, { items, ts: Date.now() });
    return items;
  },

  async getProduct(external_product_id: string): Promise<DropshipProductDetail> {
    const json = await callAliexpress("aliexpress.ds.product.get", {
      product_id: external_product_id,
      target_currency: "USD",
      target_language: "EN",
      ship_to_country: "US",
    });

    const respKey = "aliexpress_ds_product_get_response";
    const result = json?.[respKey]?.result || json?.[respKey]?.data || {};

    const images: string[] = [];
    if (result.ae_multimedia_info_dto?.image_urls) {
      for (const u of result.ae_multimedia_info_dto.image_urls.split(";")) {
        if (u) images.push(u);
      }
    }
    if (result.ae_item_base_info_dto?.product_id && images.length === 0) {
      if (result.ae_item_base_info_dto.image_url) images.push(result.ae_item_base_info_dto.image_url);
    }

    const baseInfo = result.ae_item_base_info_dto || {};
    const skuInfo = result.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o || [];
    const variants = (Array.isArray(skuInfo) ? skuInfo : []).map((sku: any) => ({
      external_variant_id: String(sku.sku_id || sku.id || ""),
      name: sku.sku_attr || sku.id || "",
      sku: sku.sku_code || null,
      price: parseFloat(sku.offer_sale_price || sku.sku_price || "0"),
      stock: sku.sku_available_stock != null ? Number(sku.sku_available_stock) : 0,
    }));

    return {
      external_product_id: String(external_product_id),
      title: baseInfo.subject || baseInfo.product_title || "Untitled",
      description: baseInfo.detail || baseInfo.mobile_detail || null,
      images,
      currency: baseInfo.currency_code || "USD",
      base_price: parseFloat(baseInfo.sale_price || baseInfo.price || "0"),
      variants,
      raw: result,
    };
  },

  async importProduct(_external_product_id: string, _shop_surface_id: string) {
    // Phase 1: import-ready only, actual import uses existing flow
    return { status: "ok" };
  },

  async createOrder(): Promise<CreateOrderResult> {
    throw new Error("Not implemented — AliExpress ordering is Phase 2");
  },

  async getOrderStatus(): Promise<OrderStatusResult> {
    throw new Error("Not implemented — AliExpress ordering is Phase 2");
  },

  async syncInventory() {
    throw new Error("Not implemented — AliExpress sync is Phase 2");
  },

  async syncPrice() {
    throw new Error("Not implemented — AliExpress sync is Phase 2");
  },
};
