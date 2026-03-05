import type { DropshipAdapter, DropshipSearchItem, DropshipProductDetail, SearchFilters, CreateOrderResult } from "./types.ts";
import { normalizeAddressForModern } from "./normalize.ts";
import { normalizeUrl, extractImageUrls } from "./normalizeUrl.ts";

const MODERN_FALLBACK_WARNING = "ModernDropship not configured (missing API key)";

function makeModernConfigError() {
  const err = new Error(MODERN_FALLBACK_WARNING) as Error & {
    code?: string;
    provider_key?: string;
  };
  err.code = "MODERNDROPSHIP_CONFIG_MISSING";
  err.provider_key = "moderndropship";
  return err;
}

// Diagnostics collector for dev-only reporting
export interface ModernDiagnostics {
  provider_http_status: number | null;
  provider_url: string;
  provider_query_params: string;
  provider_auth_header_used: string;
  provider_response_preview: string;
  request_id: string;
  error_code?: string;
  cache_hit?: boolean;
  upstream_calls_made?: number;
}

let _lastDiagnostics: ModernDiagnostics | null = null;
export function getLastModernDiagnostics(): ModernDiagnostics | null { return _lastDiagnostics; }

// ─── In-memory cache (120s TTL) ───
interface CacheEntry {
  items: DropshipSearchItem[];
  timestamp: number;
  diagnostics: ModernDiagnostics;
}
const _cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 120_000; // 2 minutes

function getCacheKey(query: string): string {
  return `modern:${query.trim().toLowerCase()}`;
}

function getCached(key: string): CacheEntry | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    _cache.delete(key);
    return null;
  }
  return entry;
}

function setCache(key: string, items: DropshipSearchItem[], diagnostics: ModernDiagnostics) {
  // Cap cache size
  if (_cache.size > 50) {
    const oldest = _cache.keys().next().value;
    if (oldest) _cache.delete(oldest);
  }
  _cache.set(key, { items, timestamp: Date.now(), diagnostics });
}

// ─── Rate-limit guard (1 call per 2 seconds) ───
let _lastCallTs = 0;
const MIN_CALL_INTERVAL_MS = 2000;

async function mdFetch(method: string, path: string, body?: Record<string, unknown>): Promise<unknown> {
  const baseUrl = Deno.env.get("MODERNDROPSHIP_BASE_URL") || "https://api.moderndropship.com";
  const apiKey = Deno.env.get("MODERNDROPSHIP_API_KEY");
  const requestId = crypto.randomUUID();

  const diag: ModernDiagnostics = {
    provider_http_status: null,
    provider_url: `${baseUrl}${path}`.replace(apiKey || "REDACTED", "***REDACTED***"),
    provider_query_params: path.includes("?") ? path.split("?")[1] : "(none)",
    provider_auth_header_used: apiKey ? "Authorization: present (API key)" : "Authorization: MISSING",
    provider_response_preview: "",
    request_id: requestId,
  };

  if (!apiKey) {
    diag.error_code = "MODERNDROPSHIP_CONFIG_MISSING";
    _lastDiagnostics = diag;
    throw makeModernConfigError();
  }

  // Throttle guard
  const now = Date.now();
  if (now - _lastCallTs < MIN_CALL_INTERVAL_MS) {
    diag.error_code = "RATE_LIMITED";
    diag.provider_http_status = 429;
    diag.provider_response_preview = "Client-side throttle: too soon since last call";
    _lastDiagnostics = diag;
    const err = new Error("Rate limited (client-side throttle)") as any;
    err.code = "RATE_LIMITED";
    err.status = 429;
    throw err;
  }
  _lastCallTs = now;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Authorization": apiKey,
        "Accept": "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });

    const rawBody = await res.text();
    diag.provider_http_status = res.status;
    diag.provider_response_preview = rawBody.slice(0, 500);

    console.log("[ModernDropship diagnostics]", {
      request_id: requestId,
      method,
      url: diag.provider_url,
      status: res.status,
      auth_header: diag.provider_auth_header_used,
      response_preview: rawBody.slice(0, 500),
    });

    _lastDiagnostics = diag;

    let data: unknown = null;
    try {
      data = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const err = new Error(`ModernDropship upstream error: ${res.status}`) as Error & {
        code?: string;
        status?: number;
        body_preview?: string;
      };
      err.code = res.status === 429 ? "RATE_LIMITED" : "UPSTREAM_PROVIDER_ERROR";
      err.status = res.status;
      err.body_preview = rawBody.slice(0, 2000);
      throw err;
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function extractProducts(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  const candidates = [
    payload?.products, payload?.items, payload?.results,
    payload?.data, payload?.data?.products, payload?.data?.items, payload?.data?.results,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

function toPositiveNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function mapModernProduct(p: any): DropshipSearchItem {
  const imageUrls = extractImageUrls(p?.images || p?.image_urls || p?.imageUrls || []);
  const thumbRaw = p?.featured_image || p?.featuredImage || p?.image?.src || p?.image || imageUrls[0] || null;
  const thumbnail = normalizeUrl(thumbRaw) || imageUrls[0] || null;
  const uniqueImages = Array.from(new Set([thumbnail, ...imageUrls].filter((img): img is string => typeof img === "string" && img.length > 0)));

  const variantPrices = Array.isArray(p?.variants)
    ? p.variants.map((v: any) => toPositiveNumber(v?.price)).filter((v: number) => v > 0)
    : [];
  const directPrice = toPositiveNumber(p?.price ?? p?.min_price ?? p?.retail_price ?? p?.sale_price);
  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : directPrice;
  const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : directPrice;

  const categoryName =
    (typeof p?.product_type === "string" && p.product_type.trim()) ? p.product_type
    : (Array.isArray(p?.tags) && p.tags.length > 0) ? String(p.tags[0])
    : null;

  const shipFrom = p?.warehouse_location || p?.warehouseLocation || p?.origin_country
    || p?.originCountry || p?.ship_from_country || p?.shipping_from || "United States";

  return {
    external_product_id: String(p?.id || p?.product_id || p?.external_id || ""),
    title: p?.title || p?.name || "",
    thumbnail_url: thumbnail,
    image_urls: uniqueImages,
    currency: "USD",
    min_price: minPrice,
    max_price: maxPrice,
    stock_hint: "unknown" as const,
    category_name: categoryName,
    ship_from_country: String(shipFrom),
    raw: p,
  };
}

export const modernDropshipAdapter: DropshipAdapter = {
  async searchProducts(query: string, _filters: SearchFilters): Promise<DropshipSearchItem[]> {
    const normalizedQuery = query.trim() || "best sellers";
    const cacheKey = getCacheKey(normalizedQuery);

    // ─── Check cache first ───
    const cached = getCached(cacheKey);
    if (cached) {
      _lastDiagnostics = { ...cached.diagnostics, cache_hit: true, upstream_calls_made: 0 };
      console.log("[ModernDropship] Cache hit for:", normalizedQuery);
      return cached.items;
    }

    let upstreamCalls = 0;

    // ─── PRIMARY: GET /buyer/products (no search params — just list catalog) ───
    const primaryPath = `/buyer/products?limit=20&page=0`;
    let items: DropshipSearchItem[] = [];

    try {
      upstreamCalls++;
      const data = await mdFetch("GET", primaryPath) as any;
      const products = extractProducts(data);
      console.log("[ModernDropship] Primary /buyer/products returned", products.length, "items");

      if (products.length > 0) {
        items = products.slice(0, 20).map(mapModernProduct);
      }
    } catch (err: any) {
      if (err?.code === "MODERNDROPSHIP_CONFIG_MISSING") throw err;
      if (err?.code === "RATE_LIMITED" || err?.status === 429) {
        // Do NOT retry on 429 — return safe empty with warning
        if (_lastDiagnostics) _lastDiagnostics.upstream_calls_made = upstreamCalls;
        throw err;
      }

      // ─── FALLBACK: GET /products (seller-side catalog) — only on 404/401/403 ───
      if (err?.status === 404 || err?.status === 401 || err?.status === 403) {
        console.log("[ModernDropship] Primary failed with", err.status, "— trying fallback /products");
        try {
          upstreamCalls++;
          const data2 = await mdFetch("GET", `/products?limit=20&page=0`) as any;
          const products2 = extractProducts(data2);
          console.log("[ModernDropship] Fallback /products returned", products2.length, "items");
          if (products2.length > 0) {
            items = products2.slice(0, 20).map(mapModernProduct);
          }
        } catch (err2: any) {
          if (err2?.code === "MODERNDROPSHIP_CONFIG_MISSING") throw err2;
          // All attempts failed — rethrow original
          if (_lastDiagnostics) _lastDiagnostics.upstream_calls_made = upstreamCalls;
          throw err;
        }
      } else {
        // Other errors (500, network, etc.) — don't fallback, just throw
        if (_lastDiagnostics) _lastDiagnostics.upstream_calls_made = upstreamCalls;
        throw err;
      }
    }

    if (_lastDiagnostics) _lastDiagnostics.upstream_calls_made = upstreamCalls;

    // Cache the result (even if empty — prevents re-spam)
    const diagSnapshot = _lastDiagnostics ? { ..._lastDiagnostics } : {
      provider_http_status: 200,
      provider_url: primaryPath,
      provider_query_params: "limit=20&page=0",
      provider_auth_header_used: "Authorization: present (API key)",
      provider_response_preview: "",
      request_id: crypto.randomUUID(),
    };
    setCache(cacheKey, items, diagSnapshot);

    return items;
  },

  async getProduct(external_product_id: string): Promise<DropshipProductDetail> {
    const data = (await mdFetch("GET", `/products/${external_product_id}`)) as any;
    const p = data?.product || data;
    if (!p || !p.id) throw new Error("Product not found");

    const variants = (p.variants || []).map((v: any) => ({
      external_variant_id: String(v.id || ""),
      name: v.title || v.name || "Default",
      sku: v.sku || null,
      price: Number(v.price || 0),
      stock: Number(v.inventoryQuantity ?? v.inventory_quantity ?? 0),
    }));

    return {
      external_product_id: String(p.id),
      title: p.title || p.name || "",
      description: p.bodyHtml || p.body_html || p.description || null,
      images: (p.images || []).map((img: any) => typeof img === "string" ? img : img.src || img.url || ""),
      currency: "USD",
      base_price: Number(p.variants?.[0]?.price || 0),
      variants,
      raw: p,
    };
  },

  async importProduct() { throw new Error("Not implemented — Phase 2"); },

  async createOrder(order_payload: Record<string, unknown>): Promise<CreateOrderResult> {
    const items = order_payload.items as any[];
    const shipping = order_payload.shipping_address as any;
    const customer = order_payload.customer as any;

    const missing: string[] = [];
    if (!shipping?.address) missing.push("shipping_address.address");
    if (!shipping?.city) missing.push("shipping_address.city");
    if (!shipping?.country) missing.push("shipping_address.country");
    if (!customer?.name) missing.push("customer.name");

    if (missing.length > 0) {
      const err = new Error(`Missing required fields for ModernDropship order: ${missing.join(", ")}`) as any;
      err.code = "BAD_REQUEST";
      throw err;
    }

    const lineItems = items.map((item: any) => ({
      variant_id: item.external_variant_id,
      quantity: item.quantity || 1,
    }));

    const normalizedAddr = normalizeAddressForModern(shipping, customer);

    const body = {
      line_items: lineItems,
      shipping_address: normalizedAddr,
      note: (order_payload.notes as string) || "",
    };

    const data = (await mdFetch("POST", "/orders", body)) as any;
    const orderId = data?.order?.id || data?.id || null;

    return {
      status: "submitted",
      provider_order_id: orderId ? String(orderId) : undefined,
      raw: data?.order || data,
    };
  },

  async getOrderStatus(provider_order_id: string) {
    const data = (await mdFetch("GET", `/orders/${provider_order_id}`)) as any;
    const o = data?.order || data;
    if (!o) throw new Error("Order not found in ModernDropship");

    const statusMap: Record<string, string> = {
      pending: "submitted", processing: "accepted", shipped: "shipped",
      delivered: "delivered", cancelled: "cancelled", failed: "failed",
    };
    const normalized = (statusMap[o.status] || o.fulfillment_status || "submitted") as any;
    const fulfillment = o.fulfillments?.[0] || {};

    return {
      status: normalized,
      tracking: {
        tracking_number: fulfillment.tracking_number || o.tracking_number || null,
        tracking_url: fulfillment.tracking_url || o.tracking_url || null,
        carrier: fulfillment.tracking_company || o.carrier || null,
        shipment_status: normalized === "delivered" ? "delivered" as const
          : normalized === "shipped" ? "shipped" as const
          : "pending" as const,
      },
      raw: o,
    };
  },

  async syncInventory() { throw new Error("Not implemented — Phase 2"); },
  async syncPrice() { throw new Error("Not implemented — Phase 2"); },
};
