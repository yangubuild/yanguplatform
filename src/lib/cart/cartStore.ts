/**
 * Global Cart Store — works across emenu, eshop, estore surfaces.
 * Uses localStorage for guests, syncs to state for current session.
 */

export interface CartItem {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  quantity: number;
  image_url?: string | null;
  variant?: string | null;
  surface_id: string;
}

export interface CartState {
  items: CartItem[];
  surface_id: string;
}

const CART_KEY = "yangu_cart";

function getStorageKey(surfaceId: string) {
  return `${CART_KEY}_${surfaceId}`;
}

export function loadCart(surfaceId: string): CartItem[] {
  try {
    const raw = localStorage.getItem(getStorageKey(surfaceId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(surfaceId: string, items: CartItem[]) {
  try {
    localStorage.setItem(getStorageKey(surfaceId), JSON.stringify(items));
  } catch {
    // Storage full or unavailable
  }
}

export function addToCart(surfaceId: string, item: Omit<CartItem, "quantity" | "surface_id">, quantity = 1): CartItem[] {
  const items = loadCart(surfaceId);
  const existing = items.find(i => i.id === item.id && i.variant === item.variant);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ ...item, quantity, surface_id: surfaceId });
  }
  saveCart(surfaceId, items);
  return items;
}

export function updateCartItemQuantity(surfaceId: string, itemId: string, quantity: number, variant?: string | null): CartItem[] {
  let items = loadCart(surfaceId);
  if (quantity <= 0) {
    items = items.filter(i => !(i.id === itemId && i.variant === (variant ?? null)));
  } else {
    const item = items.find(i => i.id === itemId && i.variant === (variant ?? null));
    if (item) item.quantity = quantity;
  }
  saveCart(surfaceId, items);
  return items;
}

export function removeFromCart(surfaceId: string, itemId: string, variant?: string | null): CartItem[] {
  const items = loadCart(surfaceId).filter(i => !(i.id === itemId && i.variant === (variant ?? null)));
  saveCart(surfaceId, items);
  return items;
}

export function clearCart(surfaceId: string): CartItem[] {
  saveCart(surfaceId, []);
  return [];
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0);
}

export function getCartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
