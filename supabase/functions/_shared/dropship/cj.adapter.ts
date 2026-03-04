import type { DropshipAdapter, DropshipSearchItem, DropshipProductDetail, SearchFilters, CreateOrderResult } from "./types.ts";
import { normalizeAddressForCJ } from "./normalize.ts";
import { normalizeUrl, extractImageUrls } from "./normalizeUrl.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// In-memory CJ token cache (per edge function cold start)
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function getCjAccessToken(): Promise<string> {
  const now = Date.now();

  // 1. Check in-memory cache first
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  // 2. Check DB cache
  const supabase = getSupabaseAdmin();
  const { data: dbToken } = await supabase.rpc("get_dropship_provider_token", {
    p_provider_key: "cj",
  });

  if (dbToken && dbToken.length > 0) {
    cachedToken = dbToken[0].access_token;
    tokenExpiresAt = new Date(dbToken[0].expires_at).getTime();
    if (now < tokenExpiresAt - 60_000) {
      return cachedToken!;
    }
  }

  // 3. Fetch new token from CJ API
  const apiKey = Deno.env.get("CJ_API_KEY");
  const baseUrl = Deno.env.get("CJ_BASE_URL") || "https://developers.cjdropshipping.com/api2.0/v1";

  if (!apiKey) throw new Error("CJ_API_KEY not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(`${baseUrl}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
      signal: controller.signal,
    });

    const data = await res.json();

    if (!res.ok || data.result === false) {
      console.error("CJ auth failed:", res.status, JSON.stringify({ code: data.code, message: data.message, result: data.result }));
      throw new Error(`CJ auth failed: ${data.message || res.status}`);
    }

    const token = data?.data?.accessToken;
    if (!token) throw new Error("CJ auth returned no accessToken");

    // CJ tokens last 15 days; cache for 14 days
    const expiresAt = new Date(now + 14 * 24 * 60 * 60 * 1000);
    cachedToken = token;
    tokenExpiresAt = expiresAt.getTime();

    // 4. Persist to DB for cross-invocation reuse
    await supabase.rpc("set_dropship_provider_token", {
      p_provider_key: "cj",
      p_access_token: token,
      p_expires_at: expiresAt.toISOString(),
    });

    return token;
  } finally {
    clearTimeout(timeout);
  }
}

async function cjFetch(method: string, path: string, body?: Record<string, unknown>): Promise<unknown> {
  const baseUrl = Deno.env.get("CJ_BASE_URL") || "https://developers.cjdropshipping.com/api2.0/v1";
  const token = await getCjAccessToken();

  const url = `${baseUrl}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "CJ-Access-Token": token,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });

    const data = await res.json();

    if (!res.ok || data.result === false) {
      console.error("CJ API error:", res.status, data.message || "");
      throw new Error(`CJ upstream error: ${data.message || res.status}`);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

async function cjGet(path: string, params: Record<string, string> = {}): Promise<unknown> {
  const baseUrl = Deno.env.get("CJ_BASE_URL") || "https://developers.cjdropshipping.com/api2.0/v1";
  const token = await getCjAccessToken();

  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${baseUrl}${path}?${qs}` : `${baseUrl}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "CJ-Access-Token": token },
      signal: controller.signal,
    });

    const data = await res.json();

    if (!res.ok || data.result === false) {
      console.error("CJ API error:", res.status, data.message || "");
      throw new Error(`CJ upstream error: ${data.message || res.status}`);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export const cjAdapter: DropshipAdapter = {
  async searchProducts(query: string, filters: SearchFilters): Promise<DropshipSearchItem[]> {
    const params: Record<string, string> = {
      productNameEn: query,
      pageNum: "1",
      pageSize: "20",
    };
    if (filters.category) params.categoryId = filters.category;
    if (filters.minPrice != null) params.minPrice = String(filters.minPrice);
    if (filters.maxPrice != null) params.maxPrice = String(filters.maxPrice);

    const data = (await cjGet("/product/list", params)) as any;
    const list = data?.data?.list || [];

    return list.map((p: any) => {
      const thumbRaw = p.productImage || p.image || p.img || p.mainImage || null;
      const imageSetRaw = p.productImageSet || p.productImageList || [];
      const imageUrls = extractImageUrls(imageSetRaw);
      const thumbnail = normalizeUrl(thumbRaw) || imageUrls[0] || null;

      return {
        external_product_id: String(p.pid || ""),
        title: p.productNameEn || p.productName || "",
        thumbnail_url: thumbnail,
        image_urls: imageUrls.length > 0 ? imageUrls : (thumbnail ? [thumbnail] : []),
        currency: "USD",
        min_price: Number(p.sellPrice || 0),
        max_price: Number(p.sellPrice || 0),
        stock_hint: "unknown" as const,
        category_name: p.categoryName || null,
        ship_from_country: p.sourceFrom === 10 ? "China" : p.sourceFrom === 20 ? "United States" : p.sourceFrom === 30 ? "Thailand" : "China",
        raw: p,
      };
    });
  },

  async getProduct(external_product_id: string): Promise<DropshipProductDetail> {
    const data = (await cjGet("/product/query", { pid: external_product_id })) as any;
    const p = data?.data;
    if (!p) throw new Error("Product not found");

    const variants = (p.variants || []).map((v: any) => ({
      external_variant_id: String(v.vid || ""),
      name: v.variantNameEn || v.variantName || "Default",
      sku: v.variantSku || null,
      price: Number(v.variantSellPrice || v.variantPrice || 0),
      stock: Number(v.variantVolume || 0),
    }));

    return {
      external_product_id: String(p.pid || external_product_id),
      title: p.productNameEn || p.productName || "",
      description: p.description || p.productDescEn || null,
      images: (p.productImageSet || []).map((img: any) => typeof img === "string" ? img : img.imageUrl || ""),
      currency: "USD",
      base_price: Number(p.sellPrice || 0),
      variants,
      raw: p,
    };
  },

  async createOrder(order_payload: Record<string, unknown>): Promise<CreateOrderResult> {
    const items = order_payload.items as any[];
    const shipping = order_payload.shipping_address as any;
    const customer = order_payload.customer as any;

    // Validate required CJ fields
    const missing: string[] = [];
    if (!shipping?.country) missing.push("shipping_address.country");
    if (!shipping?.province) missing.push("shipping_address.province");
    if (!shipping?.city) missing.push("shipping_address.city");
    if (!shipping?.address) missing.push("shipping_address.address");
    if (!customer?.name) missing.push("customer.name");
    if (!customer?.phone) missing.push("customer.phone");

    if (missing.length > 0) {
      const err = new Error(`Missing required fields for CJ order: ${missing.join(", ")}`) as any;
      err.code = "BAD_REQUEST";
      throw err;
    }

    const cjProducts = items.map((item: any) => ({
      vid: item.external_variant_id,
      quantity: item.quantity || 1,
    }));

    const normalizedAddr = normalizeAddressForCJ(shipping);

    const body = {
      orderNumber: `YANGU-${Date.now()}`,
      ...normalizedAddr,
      shippingCustomerName: customer.name,
      shippingPhone: customer.phone,
      remark: (order_payload.notes as string) || "",
      products: cjProducts,
    };

    const data = (await cjFetch("POST", "/shopping/order/createOrderV2", body)) as any;
    const orderId = data?.data?.orderId || data?.data?.orderNum || null;

    return {
      status: "submitted",
      provider_order_id: orderId ? String(orderId) : undefined,
      raw: data?.data || data,
    };
  },

  async getOrderStatus(provider_order_id: string) {
    const data = (await cjGet("/shopping/order/getOrderDetail", { orderId: provider_order_id })) as any;
    const o = data?.data;
    if (!o) throw new Error("Order not found in CJ");

    const statusMap: Record<string, string> = {
      CREATED: "submitted",
      IN_CART: "submitted",
      UNPAID: "submitted",
      UNSHIPPED: "accepted",
      SHIPPED: "shipped",
      DELIVERED: "delivered",
      CANCELLED: "cancelled",
    };
    const normalized = (statusMap[o.orderStatus] || "submitted") as any;

    const logistic = o.logisticList?.[0] || {};

    return {
      status: normalized,
      tracking: {
        tracking_number: logistic.trackingNumber || null,
        tracking_url: logistic.trackingUrl || null,
        carrier: logistic.logisticName || null,
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
