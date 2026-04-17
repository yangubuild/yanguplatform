/**
 * Buyer-side order history — localStorage list of orders the buyer placed
 * from this device. Powers the "My Orders" tab in the live-shop app shell.
 *
 * We intentionally store only lightweight references (tracking_code + summary)
 * so the My Orders view can re-fetch the canonical order from the `orders`
 * table by tracking_code. This keeps the source of truth on the server while
 * giving guests a working buyer-side history without auth.
 */

const KEY = "yangu_buyer_orders";

export interface BuyerOrderRef {
  tracking_code: string;
  surface_id: string;
  business_name?: string | null;
  total_cents: number;
  currency: string;
  item_count: number;
  placed_at: string; // ISO
}

export function loadBuyerOrders(): BuyerOrderRef[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadBuyerOrdersForSurface(surfaceId: string): BuyerOrderRef[] {
  return loadBuyerOrders().filter((o) => o.surface_id === surfaceId);
}

export function recordBuyerOrder(order: BuyerOrderRef) {
  try {
    const existing = loadBuyerOrders();
    // De-dupe by tracking_code; newest first.
    const filtered = existing.filter((o) => o.tracking_code !== order.tracking_code);
    const next = [order, ...filtered].slice(0, 50);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — non-fatal.
  }
}
