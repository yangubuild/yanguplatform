import type { DropshipAdapter, DropshipSearchItem, DropshipProductDetail, SearchFilters } from "./types.ts";

// In-memory CJ token cache (per edge function cold start)
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getCjAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const apiKey = Deno.env.get("CJ_API_KEY");
  const baseUrl = Deno.env.get("CJ_BASE_URL") || "https://developers.cjdropshipping.com/api2.0/v1";

  if (!apiKey) throw new Error("CJ_API_KEY not configured");

  const res = await fetch(`${baseUrl}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: apiKey }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("CJ auth failed:", res.status, body);
    throw new Error(`CJ auth failed: ${res.status}`);
  }

  const data = await res.json();
  const token = data?.data?.accessToken;
  if (!token) throw new Error("CJ auth returned no token");

  cachedToken = token;
  // CJ tokens typically last ~24h; cache for 23h
  tokenExpiresAt = now + 23 * 60 * 60 * 1000;
  return token;
}

async function cjFetch(path: string, body: Record<string, unknown>): Promise<unknown> {
  const baseUrl = Deno.env.get("CJ_BASE_URL") || "https://developers.cjdropshipping.com/api2.0/v1";
  const token = await getCjAccessToken();

  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": token,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("CJ API error:", res.status, errBody);
    throw new Error(`CJ upstream error: ${res.status}`);
  }

  return await res.json();
}

export const cjAdapter: DropshipAdapter = {
  async searchProducts(query: string, filters: SearchFilters): Promise<DropshipSearchItem[]> {
    const payload: Record<string, unknown> = {
      productNameEn: query,
      pageNum: 1,
      pageSize: 20,
    };
    if (filters.category) payload.categoryId = filters.category;
    if (filters.minPrice != null) payload.startPrice = filters.minPrice;
    if (filters.maxPrice != null) payload.endPrice = filters.maxPrice;

    const data = (await cjFetch("/product/list", payload)) as any;
    const list = data?.data?.list || [];

    return list.map((p: any) => ({
      external_product_id: String(p.pid || p.productId || ""),
      title: p.productNameEn || p.productName || "",
      thumbnail_url: p.productImage || null,
      currency: "USD",
      min_price: Number(p.sellPrice || p.productPrice || 0),
      max_price: Number(p.sellPrice || p.productPrice || 0),
      stock_hint: "unknown" as const,
      raw: p,
    }));
  },

  async getProduct(external_product_id: string): Promise<DropshipProductDetail> {
    const data = (await cjFetch("/product/query", { pid: external_product_id })) as any;
    const p = data?.data;
    if (!p) throw new Error("Product not found");

    const variants = (p.variants || []).map((v: any) => ({
      external_variant_id: String(v.vid || ""),
      name: (v.variantNameEn || v.variantName || "Default"),
      sku: v.variantSku || null,
      price: Number(v.variantSellPrice || v.variantPrice || 0),
      stock: Number(v.variantStock || 0),
    }));

    return {
      external_product_id: String(p.pid || p.productId || external_product_id),
      title: p.productNameEn || p.productName || "",
      description: p.description || p.productDescEn || null,
      images: (p.productImageSet || []).map((img: any) => typeof img === "string" ? img : img.imageUrl || ""),
      currency: "USD",
      base_price: Number(p.sellPrice || p.productPrice || 0),
      variants,
      raw: p,
    };
  },

  async importProduct() { throw new Error("Not implemented — Phase 2"); },
  async createOrder() { throw new Error("Not implemented — Phase 2"); },
  async syncInventory() { throw new Error("Not implemented — Phase 2"); },
  async syncPrice() { throw new Error("Not implemented — Phase 2"); },
};
