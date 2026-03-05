import type {
  DropshipAdapter,
  DropshipSearchItem,
  DropshipProductDetail,
  SearchFilters,
  CreateOrderResult,
  OrderStatusResult,
} from "./types.ts";
import { crypto as stdCrypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const BASE_URL = (Deno.env.get("ALIEXPRESS_BASE_URL") || "https://api-sg.aliexpress.com/sync").trim();
const APP_KEY = (Deno.env.get("ALIEXPRESS_APP_KEY") || "528918").trim();
const CACHE_TTL_MS = 120_000;
const MIN_CALL_INTERVAL_MS = 2_000;

type SignMethod = "md5" | "sha256";
type AuthParamName = "app_key" | "client_id";
type HttpMethod = "GET" | "POST";
type PayloadStyle = "param0" | "flat";

interface CacheEntry { items: DropshipSearchItem[]; ts: number }

interface AttemptSpec {
  variant: "A" | "B";
  auth_param_name: AuthParamName;
  sign_method: SignMethod;
  http_method: HttpMethod;
  payload_style: PayloadStyle;
}

interface AttemptResult {
  ok: boolean;
  json: Record<string, unknown> | null;
  diagnostic: Record<string, unknown>;
}

const ATTEMPT_SPECS: AttemptSpec[] = [
  {
    variant: "A",
    auth_param_name: "app_key",
    sign_method: "md5",
    http_method: "POST",
    payload_style: "param0",
  },
  {
    variant: "B",
    auth_param_name: "client_id",
    sign_method: "sha256",
    http_method: "GET",
    payload_style: "flat",
  },
];

const _cache = new Map<string, CacheEntry>();
let _lastCallTs = 0;
let _lastDebugTs = 0;
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
  if (Date.now() - e.ts > CACHE_TTL_MS) {
    _cache.delete(key);
    return null;
  }
  return e;
}

function toUpperHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

async function digestSignature(content: string, method: SignMethod): Promise<string> {
  const data = new TextEncoder().encode(content);
  if (method === "md5") {
    const md5 = await stdCrypto.subtle.digest("MD5", data);
    return toUpperHex(new Uint8Array(md5));
  }

  const sha = await crypto.subtle.digest("SHA-256", data);
  return toUpperHex(new Uint8Array(sha));
}

function safeParseJson(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

function buildSearchPayload(keyword: string, shipToCountry: string): Record<string, string> {
  return {
    keyword,
    page_no: "1",
    page_size: "20",
    target_currency: "USD",
    target_language: "EN",
    ship_to_country: shipToCountry,
    sort: "SALE_PRICE_ASC",
  };
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
  return list
    .filter((i): i is Record<string, unknown> => Boolean(i) && typeof i === "object")
    .map(normalizeSearchItem);
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

function buildSignatureInput(params: Record<string, string>, appSecret: string): {
  sortedKeys: string[];
  signInput: string;
  signInputMasked: string;
} {
  const sortedKeys = Object.keys(params)
    .filter((k) => k !== "sign")
    .sort();
  const concat = sortedKeys.map((k) => `${k}${params[k]}`).join("");
  return {
    sortedKeys,
    signInput: `${appSecret}${concat}${appSecret}`,
    signInputMasked: `***${concat}***`,
  };
}

function redactSignedParams(params: Record<string, string>): Record<string, unknown> {
  return {
    keys: Object.keys(params).sort(),
    visible_values: {
      method: params.method,
      timestamp: params.timestamp,
      format: params.format,
      v: params.v,
      sign_method: params.sign_method,
    },
  };
}

async function runAttempt(apiMethod: string, payload: Record<string, string>, spec: AttemptSpec): Promise<AttemptResult> {
  const appSecret = (Deno.env.get("ALIEXPRESS_APP_SECRET") || "").trim();
  if (!appSecret || !APP_KEY) {
    const message = "AliExpress not configured (missing APP_KEY/APP_SECRET)";
    return {
      ok: false,
      json: null,
      diagnostic: {
        base_url_used: BASE_URL,
        endpoint_url: BASE_URL,
        api_method: apiMethod,
        method_name: apiMethod,
        http_method: spec.http_method,
        content_type: spec.http_method === "POST" ? "application/x-www-form-urlencoded;charset=UTF-8" : "application/json",
        timestamp_used: aeTimestamp(),
        sign_method_used: spec.sign_method,
        sorted_param_keys: [],
        param_string_before_sign: "***",
        signature_preview: "",
        final_signed_params: { keys: [] },
        response_http_status: 0,
        response_body_first_800_chars: "",
        aliexpress_error_code: "ALIEXPRESS_CONFIG_MISSING",
        aliexpress_error_message: message,
        request_id: null,
        auth_param_name: spec.auth_param_name,
        attempt_variant: spec.variant,
      },
    };
  }

  const timestamp = aeTimestamp();
  const businessParams = spec.payload_style === "param0"
    ? { param0: JSON.stringify(payload) }
    : payload;

  const unsignedParams: Record<string, string> = {
    [spec.auth_param_name]: APP_KEY,
    method: apiMethod,
    timestamp,
    format: "json",
    v: "2.0",
    sign_method: spec.sign_method,
    ...businessParams,
  };

  const { sortedKeys, signInput, signInputMasked } = buildSignatureInput(unsignedParams, appSecret);
  const signature = await digestSignature(signInput, spec.sign_method);
  const signedParams: Record<string, string> = { ...unsignedParams, sign: signature };

  const contentType = spec.http_method === "POST"
    ? "application/x-www-form-urlencoded;charset=UTF-8"
    : "application/json";

  const url = spec.http_method === "GET"
    ? `${BASE_URL}?${new URLSearchParams(signedParams).toString()}`
    : BASE_URL;

  const res = await fetch(url, {
    method: spec.http_method,
    headers: spec.http_method === "POST" ? { "Content-Type": contentType } : undefined,
    body: spec.http_method === "POST" ? new URLSearchParams(signedParams).toString() : undefined,
  });

  const responseText = await res.text();
  const json = safeParseJson(responseText);
  const aliError = extractAliError(json);
  const ok = res.ok && !aliError.code;

  return {
    ok,
    json,
    diagnostic: {
      base_url_used: BASE_URL,
      endpoint_url: BASE_URL,
      api_method: apiMethod,
      method_name: apiMethod,
      http_method: spec.http_method,
      content_type: contentType,
      timestamp_used: timestamp,
      sign_method_used: spec.sign_method,
      sorted_param_keys: sortedKeys,
      param_string_before_sign: signInputMasked,
      signature_preview: signature.length > 12 ? `${signature.slice(0, 6)}...${signature.slice(-6)}` : signature,
      final_signed_params: redactSignedParams(signedParams),
      response_http_status: res.status,
      response_body_first_800_chars: responseText.slice(0, 800),
      aliexpress_error_code: aliError.code,
      aliexpress_error_message: aliError.message,
      request_id: aliError.requestId,
      auth_param_name: spec.auth_param_name,
      attempt_variant: spec.variant,
      payload_style: spec.payload_style,
    },
  };
}

async function runSearchWithTwoAttempts(keyword: string, shipToCountry: string): Promise<{
  ok: boolean;
  items: DropshipSearchItem[];
  diagnostics: Record<string, unknown>[];
  successfulVariant: string | null;
}> {
  const payload = buildSearchPayload(keyword, shipToCountry);
  const diagnostics: Record<string, unknown>[] = [];

  for (const spec of ATTEMPT_SPECS) {
    const attempt = await runAttempt("aliexpress.ds.text.search", payload, spec);
    diagnostics.push(attempt.diagnostic);

    if (attempt.ok) {
      const items = extractSearchItems(attempt.json);
      return {
        ok: true,
        items,
        diagnostics,
        successfulVariant: spec.variant,
      };
    }
  }

  return {
    ok: false,
    items: [],
    diagnostics,
    successfulVariant: null,
  };
}

export async function runAliExpressDebugSearch(
  query: string,
  filters: SearchFilters & { country?: string } = {},
): Promise<Record<string, unknown>> {
  const now = Date.now();
  if (now - _lastDebugTs < MIN_CALL_INTERVAL_MS) {
    const throttled = {
      ok: false,
      rate_limited: true,
      message: "AliExpress debug mode throttled: max 1 request per 2 seconds",
      attempts: [],
      base_url_used: BASE_URL,
      api_method: "aliexpress.ds.text.search",
    };
    _lastDiag = throttled;
    return throttled;
  }
  _lastDebugTs = now;

  const keyword = query.trim() || "trending best sellers";
  const shipToCountry = typeof (filters as Record<string, unknown>).country === "string"
    ? String((filters as Record<string, unknown>).country)
    : "US";

  const result = await runSearchWithTwoAttempts(keyword, shipToCountry);
  const attempts = result.diagnostics;
  const tokenRequired = attempts.some((a) => {
    const code = String(a.aliexpress_error_code || "").toLowerCase();
    const message = String(a.aliexpress_error_message || "").toLowerCase();
    return code.includes("token") || message.includes("token") || message.includes("session");
  });

  const payload = {
    ok: result.ok,
    api_method: "aliexpress.ds.text.search",
    base_url_used: BASE_URL,
    attempts,
    successful_attempt_variant: result.successfulVariant,
    sign_method_that_succeeded: result.successfulVariant
      ? String((attempts.find((a) => a.attempt_variant === result.successfulVariant)?.sign_method_used) || "")
      : null,
    result_count: result.items.length,
    first_product_title: result.items[0]?.title || null,
    token_required: tokenRequired,
    items: result.items,
    disable_recommended: !result.ok,
  };

  _lastDiag = payload;
  return payload;
}

export const aliexpressAdapter: DropshipAdapter = {
  async searchProducts(query: string, filters: SearchFilters & { bypass_cache?: boolean; country?: string }): Promise<DropshipSearchItem[]> {
    const keyword = query.trim() || "trending best sellers";
    const shipToCountry = typeof filters?.country === "string" ? filters.country : "US";
    const cacheKey = `ae:${keyword}:${shipToCountry}:v2`;

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

    const result = await runSearchWithTwoAttempts(keyword, shipToCountry);
    _lastDiag = {
      ok: result.ok,
      api_method: "aliexpress.ds.text.search",
      base_url_used: BASE_URL,
      attempts: result.diagnostics,
      successful_attempt_variant: result.successfulVariant,
      result_count: result.items.length,
      first_product_title: result.items[0]?.title || null,
    };

    if (!result.ok) {
      const first = result.diagnostics[0] || {};
      const err: any = new Error(String(first.aliexpress_error_message || "AliExpress request failed"));
      err.code = first.aliexpress_error_code || "ALIEXPRESS_UPSTREAM_ERROR";
      err.status = Number(first.response_http_status || 502);
      throw err;
    }

    _cache.set(cacheKey, { items: result.items, ts: Date.now() });
    return result.items;
  },

  async getProduct(external_product_id: string): Promise<DropshipProductDetail> {
    const notImplementedRaw = { reason: "AliExpress product detail pending signature verification", external_product_id };
    return {
      external_product_id,
      title: "AliExpress product",
      description: null,
      images: [],
      currency: "USD",
      base_price: 0,
      variants: [],
      raw: notImplementedRaw,
    };
  },

  async importProduct(_external_product_id: string, _shop_surface_id: string) {
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
