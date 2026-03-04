import type { DropshipAdapter, DropshipSearchItem, DropshipProductDetail, SearchFilters, CreateOrderResult } from "./types.ts";
import { normalizeAddressForModern } from "./normalize.ts";
import { normalizeUrl, extractImageUrls } from "./normalizeUrl.ts";

async function mdFetch(method: string, path: string, body?: Record<string, unknown>): Promise<unknown> {
  const baseUrl = Deno.env.get("MODERNDROPSHIP_BASE_URL") || "https://api.moderndropship.com";
  const apiKey = Deno.env.get("MODERNDROPSHIP_API_KEY");

  if (!apiKey) throw new Error("MODERNDROPSHIP_API_KEY not configured");

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

    if (!res.ok) {
      const errBody = await res.text();
      console.error("ModernDropship API error:", res.status, errBody);
      throw new Error(`ModernDropship upstream error: ${res.status}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const modernDropshipAdapter: DropshipAdapter = {
  async searchProducts(query: string, _filters: SearchFilters): Promise<DropshipSearchItem[]> {
    const params = new URLSearchParams({
      title: query,
      limit: "20",
      page: "0",
    });

    const data = (await mdFetch("GET", `/products?${params.toString()}`)) as any;
    const products = Array.isArray(data) ? data : (data?.products || data?.data || []);

    return products.map((p: any) => {
      const thumbRaw = p.image?.src || p.images?.[0]?.src || null;
      const imageUrls = extractImageUrls(p.images);
      const thumbnail = normalizeUrl(thumbRaw) || imageUrls[0] || null;

      return {
        external_product_id: String(p.id || ""),
        title: p.title || p.name || "",
        thumbnail_url: thumbnail,
        image_urls: imageUrls.length > 0 ? imageUrls : (thumbnail ? [thumbnail] : []),
        currency: "USD",
        min_price: Number(p.variants?.[0]?.price || 0),
        max_price: Number(p.variants?.[p.variants?.length - 1]?.price || p.variants?.[0]?.price || 0),
        stock_hint: "unknown" as const,
        raw: p,
      };
    });
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
