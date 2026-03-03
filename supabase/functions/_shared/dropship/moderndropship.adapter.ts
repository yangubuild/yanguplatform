import type { DropshipAdapter, DropshipSearchItem, DropshipProductDetail, SearchFilters } from "./types.ts";

async function mdFetch(path: string): Promise<unknown> {
  const baseUrl = Deno.env.get("MODERNDROPSHIP_BASE_URL") || "https://api.moderndropship.com";
  const apiKey = Deno.env.get("MODERNDROPSHIP_API_KEY");

  if (!apiKey) throw new Error("MODERNDROPSHIP_API_KEY not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: {
        "Authorization": apiKey,
        "Accept": "application/json",
      },
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

    const data = (await mdFetch(`/products?${params.toString()}`)) as any;
    const products = Array.isArray(data) ? data : (data?.products || data?.data || []);

    return products.map((p: any) => ({
      external_product_id: String(p.id || ""),
      title: p.title || p.name || "",
      thumbnail_url: p.image?.src || p.images?.[0]?.src || null,
      currency: "USD",
      min_price: Number(p.variants?.[0]?.price || 0),
      max_price: Number(p.variants?.[p.variants?.length - 1]?.price || p.variants?.[0]?.price || 0),
      stock_hint: "unknown" as const,
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
  async createOrder() { throw new Error("Not implemented — Phase 2"); },
  async syncInventory() { throw new Error("Not implemented — Phase 2"); },
  async syncPrice() { throw new Error("Not implemented — Phase 2"); },
};
