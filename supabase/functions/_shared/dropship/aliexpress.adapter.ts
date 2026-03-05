import type {
  DropshipAdapter,
  DropshipSearchItem,
  DropshipProductDetail,
  SearchFilters,
  CreateOrderResult,
  OrderStatusResult,
} from "./types.ts";

const BASE_URL = "https://api-sg.aliexpress.com/sync";
const APP_KEY = (Deno.env.get("ALIEXPRESS_APP_KEY") || "").trim();
const CACHE_TTL_MS = 120_000;
const MIN_CALL_INTERVAL_MS = 2_000;

interface CacheEntry { items: DropshipSearchItem[]; ts: number }

const _cache = new Map<string, CacheEntry>();
let _lastCallTs = 0;
let _lastDiag: Record<string, unknown> | null = null;

export function getLastAliexpressDiagnostics() {
  return _lastDiag;
}

function aeTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

function getCached(key: string): CacheEntry | null {
  const e = _cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL_MS) { _cache.delete(key); return null; }
  return e;
}

function toUpperHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

async function hmacSha256Sign(secret: string, content: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(content));
  return toUpperHex(new Uint8Array(sig));
}

function safeParseJson(text: string): Record<string, unknown> | null {
  try {
    const p = JSON.parse(text);
    return p && typeof p === "object" ? p as Record<string, unknown> : null;
  } catch { return null; }
}

function normalizeSearchItem(item: Record<string, unknown>): DropshipSearchItem {
  const images: string[] = [];
  const mainImage = typeof item.product_main_image_url === "string" ? item.product_main_image_url : "";
  if (mainImage) images.push(mainImage);

  const small = (item.product_small_image_urls as { string?: unknown[] } | undefined)?.string;
  if (Array.isArray(small)) {
    for (const u of small) {
      if (typeof u === "string" && !images.includes(u)) images.push(u);
    }
  }

  const sale = Number.parseFloat(String(item.target_sale_price ?? item.target_original_price ?? "0"));
  const original = Number.parseFloat(String(item.target_original_price ?? item.target_sale_price ?? "0"));

  return {
    external_product_id: String(item.product_id ?? ""),
    title: String(item.product_title ?? "Untitled"),
    thumbnail_url: mainImage || null,
    image_urls: images,
    currency: String(item.target_sale_price_currency ?? item.target_original_price_currency ?? "USD"),
    min_price: Number.isFinite(sale) ? sale : 0,
    max_price: Number.isFinite(original) && original > sale ? original : Number.isFinite(sale) ? sale : 0,
    stock_hint: "unknown",
    category_name: null,
    ship_from_country: null,
    raw: item,
  };
}

function extractSearchItems(json: Record<string, unknown> | null): DropshipSearchItem[] {
  if (!json) return [];
  const response = json.aliexpress_ds_text_search_response as Record<string, unknown> | undefined;
  const data = (response?.data as Record<string, unknown> | undefined) ||
    ((response?.resp_result as Record<string, unknown> | undefined)?.result as Record<string, unknown> | undefined) ||
    (json.result as Record<string, unknown> | undefined);

  const productsNode = data?.products as Record<string, unknown> | undefined;
  const list = (productsNode?.product as unknown[]) || (Array.isArray(data?.products) ? (data?.products as unknown[]) : []);
  if (!Array.isArray(list)) return [];
  return list.filter((i): i is Record<string, unknown> => Boolean(i) && typeof i === "object").map(normalizeSearchItem);
}

function extractAliError(json: Record<string, unknown> | null): { code: string | null; message: string | null; requestId: string | null } {
  const errorResp = (json?.error_response as Record<string, unknown> | undefined) || null;
  const code = errorResp?.code != null ? String(errorResp.code) : null;
  const messageRaw = errorResp?.sub_msg ?? errorResp?.msg ?? json?.message ?? null;
  const message = messageRaw != null ? String(messageRaw) : null;
  const requestIdRaw = errorResp?.request_id ?? json?.request_id ?? null;
  const requestId = requestIdRaw != null ? String(requestIdRaw) : null;
  return { code, message, requestId };
}

interface SearchResult {
  ok: boolean;
  items: DropshipSearchItem[];
  diagnostic: Record<string, unknown>;
}

async function doAliExpressSearch(keyword: string, countryCode: string, currency: string, local: string, accessToken?: string | null): Promise<SearchResult> {
  const appSecret = (Deno.env.get("ALIEXPRESS_APP_SECRET") || "").trim();
  if (!appSecret || !APP_KEY) {
    return {
      ok: false, items: [],
      diagnostic: { error: "ALIEXPRESS_CONFIG_MISSING", message: "Missing APP_KEY or APP_SECRET" },
    };
  }

  if (!accessToken) {
    return {
      ok: false, items: [],
      diagnostic: { error: "ALIEXPRESS_TOKEN_REQUIRED", message: "AliExpress OAuth access token required. Please connect your AliExpress account." },
    };
  }

  const timestamp = aeTimestamp();

  // All params that go into the signature + request body (flat, root-level)
  const params: Record<string, string> = {
    app_key: APP_KEY,
    method: "aliexpress.ds.text.search",
    timestamp,
    format: "json",
    v: "2.0",
    sign_method: "sha256",
    session: accessToken,
    // Business params — required by DS text search
    keyWord: keyword,
    local: local,
    countryCode: countryCode,
    currency: currency,
    pageSize: "20",
    pageIndex: "1",
  };

  // Build HMAC-SHA256 signature: sort keys, concat key+value, HMAC with appSecret
  const sortedKeys = Object.keys(params).sort();
  const concat = sortedKeys.map((k) => `${k}${params[k]}`).join("");
  const signature = await hmacSha256Sign(appSecret, concat);

  const signedParams: Record<string, string> = { ...params, sign: signature };

  // POST form-encoded
  let res: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams(signedParams).toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (fetchErr: any) {
    return {
      ok: false, items: [],
      diagnostic: {
        error: "FETCH_FAILED",
        message: fetchErr?.message || "Fetch failed",
        base_url_used: BASE_URL,
        sorted_param_keys: sortedKeys,
        sign_method_used: "hmac-sha256",
        timestamp_used: timestamp,
      },
    };
  }

  const responseText = await res.text();
  const json = safeParseJson(responseText);
  const aliError = extractAliError(json);
  const ok = res.ok && !aliError.code;
  const items = ok ? extractSearchItems(json) : [];

  const diagnostic: Record<string, unknown> = {
    base_url_used: BASE_URL,
    api_method: "aliexpress.ds.text.search",
    http_method: "POST",
    sign_method_used: "hmac-sha256",
    timestamp_used: timestamp,
    sorted_param_keys: sortedKeys,
    signature_preview: signature.length > 12 ? `${signature.slice(0, 6)}...${signature.slice(-6)}` : signature,
    response_http_status: res.status,
    response_body_first_800_chars: responseText.slice(0, 800),
    aliexpress_error_code: aliError.code,
    aliexpress_error_message: aliError.message,
    request_id: aliError.requestId,
    result_count: items.length,
  };

  return { ok, items, diagnostic };
}

export async function runAliExpressDebugSearch(
  query: string,
  filters: SearchFilters & { country?: string } = {},
  accessToken?: string | null,
): Promise<Record<string, unknown>> {
  const keyword = query.trim() || "shoes";
  const countryCode = typeof filters.country === "string" ? filters.country : "US";

  const result = await doAliExpressSearch(keyword, countryCode, "USD", "en_US", accessToken);
  const payload = {
    ok: result.ok,
    api_method: "aliexpress.ds.text.search",
    base_url_used: BASE_URL,
    result_count: result.items.length,
    first_product_title: result.items[0]?.title || null,
    diagnostic: result.diagnostic,
    items: result.items,
  };
  _lastDiag = payload;
  return payload;
}

export const aliexpressAdapter: DropshipAdapter = {
  async searchProducts(query: string, filters: SearchFilters & { bypass_cache?: boolean; country?: string; access_token?: string | null }): Promise<DropshipSearchItem[]> {
    const keyword = query.trim() || "trending best sellers";
    const countryCode = typeof filters?.country === "string" ? filters.country : "US";
    const accessToken = filters?.access_token || null;
    const cacheKey = `ae:${keyword}:${countryCode}:v3`;

    if (!filters?.bypass_cache) {
      const cached = getCached(cacheKey);
      if (cached) return cached.items;
    } else {
      _cache.delete(cacheKey);
    }

    const now = Date.now();
    if (now - _lastCallTs < MIN_CALL_INTERVAL_MS) {
      const err: any = new Error("AliExpress rate limited (throttle)");
      err.code = "RATE_LIMITED";
      err.status = 429;
      throw err;
    }
    _lastCallTs = now;

    const result = await doAliExpressSearch(keyword, countryCode, "USD", "en_US", accessToken);
    _lastDiag = result.diagnostic;

    if (!result.ok) {
      const errCode = String(result.diagnostic.aliexpress_error_code || "ALIEXPRESS_UPSTREAM_ERROR");
      const errMsg = String(result.diagnostic.aliexpress_error_message || "AliExpress request failed");
      const err: any = new Error(errMsg);
      err.code = errCode;
      err.status = Number(result.diagnostic.response_http_status || 502);
      throw err;
    }

    _cache.set(cacheKey, { items: result.items, ts: Date.now() });
    return result.items;
  },

  async getProduct(external_product_id: string): Promise<DropshipProductDetail> {
    return {
      external_product_id,
      title: "AliExpress product",
      description: null,
      images: [],
      currency: "USD",
      base_price: 0,
      variants: [],
      raw: { reason: "Product detail not yet implemented" },
    };
  },

  async importProduct() { return { status: "ok" }; },
  async createOrder(): Promise<CreateOrderResult> { throw new Error("Not implemented"); },
  async getOrderStatus(): Promise<OrderStatusResult> { throw new Error("Not implemented"); },
  async syncInventory() { throw new Error("Not implemented"); },
  async syncPrice() { throw new Error("Not implemented"); },
};
