import type { DropshipAdapter, DropshipSearchItem, DropshipProductDetail, SearchFilters } from "./types.ts";

async function mdFetch(path: string, method = "GET", body?: unknown): Promise<unknown> {
  const baseUrl = Deno.env.get("MODERNDROPSHIP_BASE_URL") || "https://app.moderndropship.com/api/v1";
  const apiKey = Deno.env.get("MODERNDROPSHIP_API_KEY");

  if (!apiKey) throw new Error("MODERNDROPSHIP_API_KEY not configured");

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("ModernDropship API error:", res.status, errBody);
    throw new Error(`ModernDropship upstream error: ${res.status}`);
  }

  return await res.json();
}

export const modernDropshipAdapter: DropshipAdapter = {
  async searchProducts(query: string, filters: SearchFilters): Promise<DropshipSearchItem[]> {
    const params = new URLSearchParams({ q: query, limit: "20" });
    if (filters.category) params.set("category", filters.category);
    if (filters.minPrice != null) params.set("min_price", String(filters.minPrice));
    if (filters.maxPrice != null) params.set("max_price", String(filters.maxPrice));

    const data = (await mdFetch(`/products?${params.toString()}`)) as any;
    const products = data?.products || data?.data || [];

    return products.map((p: any) => ({
      external_product_id: String(p.id || ""),
      title: p.title || p.name || "",
      thumbnail_url: p.image_url || p.thumbnail || null,
      currency: p.currency || "USD",
      min_price: Number(p.min_price || p.price || 0),
      max_price: Number(p.max_price || p.price || 0),
      stock_hint: p.in_stock === true ? "in_stock" as const : p.in_stock === false ? "out_of_stock" as const : "unknown" as const,
      raw: p,
    }));
  },

  async getProduct(external_product_id: string): Promise<DropshipProductDetail> {
    const data = (await mdFetch(`/products/${external_product_id}`)) as any;
    const p = data?.product || data;

    if (!p || !p.id) throw new Error("Product not found");

    const variants = (p.variants || []).map((v: any) => ({
      external_variant_id: String(v.id || ""),
      name: v.title || v.name || "Default",
      sku: v.sku || null,
      price: Number(v.price || 0),
      stock: Number(v.inventory_quantity ?? v.stock ?? 0),
    }));

    return {
      external_product_id: String(p.id),
      title: p.title || p.name || "",
      description: p.body_html || p.description || null,
      images: (p.images || []).map((img: any) => typeof img === "string" ? img : img.src || img.url || ""),
      currency: p.currency || "USD",
      base_price: Number(p.price || p.min_price || 0),
      variants,
      raw: p,
    };
  },

  async importProduct() { throw new Error("Not implemented — Phase 2"); },
  async createOrder() { throw new Error("Not implemented — Phase 2"); },
  async syncInventory() { throw new Error("Not implemented — Phase 2"); },
  async syncPrice() { throw new Error("Not implemented — Phase 2"); },
};
