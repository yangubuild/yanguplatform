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

async function mdFetch(method: string, path: string, body?: Record<string, unknown>): Promise<unknown> {
  const baseUrl = Deno.env.get("MODERNDROPSHIP_BASE_URL") || "https://api.moderndropship.com";
  const apiKey = Deno.env.get("MODERNDROPSHIP_API_KEY");

  if (!apiKey) throw makeModernConfigError();

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
    const bodyPreview = rawBody.slice(0, 200);

    console.log("moderndropship response", {
      path,
      status: res.status,
      body_preview: bodyPreview,
    });

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
      err.code = "UPSTREAM_PROVIDER_ERROR";
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
    payload?.products,
    payload?.items,
    payload?.results,
    payload?.data,
    payload?.data?.products,
    payload?.data?.items,
    payload?.data?.results,
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
    (typeof p?.product_type === "string" && p.product_type.trim())
      ? p.product_type
      : (Array.isArray(p?.tags) && p.tags.length > 0)
        ? String(p.tags[0])
        : null;

  const shipFrom =
    p?.warehouse_location ||
    p?.warehouseLocation ||
    p?.origin_country ||
    p?.originCountry ||
    p?.ship_from_country ||
    p?.shipping_from ||
    "United States";

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
    const normalizedQuery = query.trim();
    const fallbackQuery = "best sellers";

    const attempts: Array<{ label: string; endpoint: string; params: Record<string, string> }> = [
      { label: "products_query", endpoint: "/products", params: { query: normalizedQuery, limit: "20", page: "0" } },
      { label: "products_title", endpoint: "/products", params: { title: normalizedQuery, limit: "20", page: "0" } },
      { label: "products_code", endpoint: "/products", params: { productCode: normalizedQuery, limit: "20", page: "0" } },
      ...(normalizedQuery.toLowerCase() !== fallbackQuery
        ? [
            { label: "products_fallback_query", endpoint: "/products", params: { query: fallbackQuery, limit: "20", page: "0" } },
            { label: "products_fallback_title", endpoint: "/products", params: { title: fallbackQuery, limit: "20", page: "0" } },
            { label: "products_fallback_code", endpoint: "/products", params: { productCode: fallbackQuery, limit: "20", page: "0" } },
          ]
        : []),
      { label: "products_catalog_0", endpoint: "/products", params: { limit: "20", page: "0" } },
      { label: "products_catalog_1", endpoint: "/products", params: { limit: "20", page: "1" } },

      // Buyer accounts often expose products via /buyer/products.
      { label: "buyer_products_code", endpoint: "/buyer/products", params: { productCode: normalizedQuery, limit: "20", page: "0" } },
      { label: "buyer_products_buyer_code", endpoint: "/buyer/products", params: { buyerProductCode: normalizedQuery, limit: "20", page: "0" } },
      ...(normalizedQuery.toLowerCase() !== fallbackQuery
        ? [
            { label: "buyer_products_fallback_code", endpoint: "/buyer/products", params: { productCode: fallbackQuery, limit: "20", page: "0" } },
            { label: "buyer_products_fallback_buyer_code", endpoint: "/buyer/products", params: { buyerProductCode: fallbackQuery, limit: "20", page: "0" } },
          ]
        : []),
      { label: "buyer_products_catalog_0", endpoint: "/buyer/products", params: { limit: "20", page: "0" } },
      { label: "buyer_products_catalog_1", endpoint: "/buyer/products", params: { limit: "20", page: "1" } },
    ];

    let lastUpstreamError: any = null;

    for (const attempt of attempts) {
      const params = new URLSearchParams(attempt.params);
      const path = `${attempt.endpoint}?${params.toString()}`;

      try {
        const data = (await mdFetch("GET", path)) as any;
        const products = extractProducts(data);

        console.log("moderndropship parsed", {
          attempt: attempt.label,
          endpoint: attempt.endpoint,
          parsed_items: products.length,
          first_item_keys: products[0] ? Object.keys(products[0]).slice(0, 20) : [],
        });

        if (products.length > 0) {
          return products.slice(0, 20).map(mapModernProduct);
        }
      } catch (err: any) {
        if (err?.code === "MODERNDROPSHIP_CONFIG_MISSING") throw err;

        lastUpstreamError = err;
        console.error("moderndropship search attempt failed", {
          attempt: attempt.label,
          endpoint: attempt.endpoint,
          message: err?.message,
          status: err?.status,
          body_preview: String(err?.body_preview || "").slice(0, 200),
          stack: err?.stack,
        });
      }
    }

    if (lastUpstreamError) {
      throw lastUpstreamError;
    }

    return [];
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
      pending: "submitted",
      processing: "accepted",
      shipped: "shipped",
      delivered: "delivered",
      cancelled: "cancelled",
      failed: "failed",
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
