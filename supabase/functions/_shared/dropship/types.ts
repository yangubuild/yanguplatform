// Normalized types for the dropship connector system

export interface DropshipSearchItem {
  external_product_id: string;
  title: string;
  thumbnail_url: string | null;
  currency: string;
  min_price: number;
  max_price: number;
  stock_hint: "in_stock" | "out_of_stock" | "unknown";
  raw: Record<string, unknown>;
}

export interface DropshipProductVariant {
  external_variant_id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
}

export interface DropshipProductDetail {
  external_product_id: string;
  title: string;
  description: string | null;
  images: string[];
  currency: string;
  base_price: number;
  variants: DropshipProductVariant[];
  raw: Record<string, unknown>;
}

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface CreateOrderResult {
  status: string;
  provider_order_id?: string;
  raw?: Record<string, unknown>;
}

export interface DropshipAdapter {
  searchProducts(query: string, filters: SearchFilters): Promise<DropshipSearchItem[]>;
  getProduct(external_product_id: string): Promise<DropshipProductDetail>;
  importProduct(external_product_id: string, shop_surface_id: string): Promise<{ status: string }>;
  createOrder(order_payload: Record<string, unknown>): Promise<CreateOrderResult>;
  syncInventory(external_product_id: string): Promise<{ status: string }>;
  syncPrice(external_product_id: string): Promise<{ status: string }>;
}

export interface DropshipError {
  error: {
    code: "PROVIDER_DISABLED" | "BAD_REQUEST" | "UPSTREAM_ERROR" | "NOT_IMPLEMENTED" | "PROVIDER_NOT_FOUND";
    message: string;
  };
}
