/**
 * Hook: useCart
 * React state wrapper around the cart store for a specific surface.
 */

import { useState, useCallback, useMemo } from "react";
import {
  loadCart, addToCart, updateCartItemQuantity, removeFromCart, clearCart,
  getCartTotal, getCartCount, type CartItem,
} from "@/lib/cart/cartStore";

export function useCart(surfaceId: string) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart(surfaceId));

  const add = useCallback((item: Omit<CartItem, "quantity" | "surface_id">, qty = 1) => {
    setItems(addToCart(surfaceId, item, qty));
  }, [surfaceId]);

  const updateQty = useCallback((itemId: string, qty: number, variant?: string | null) => {
    setItems(updateCartItemQuantity(surfaceId, itemId, qty, variant));
  }, [surfaceId]);

  const remove = useCallback((itemId: string, variant?: string | null) => {
    setItems(removeFromCart(surfaceId, itemId, variant));
  }, [surfaceId]);

  const clear = useCallback(() => {
    setItems(clearCart(surfaceId));
  }, [surfaceId]);

  const total = useMemo(() => getCartTotal(items), [items]);
  const count = useMemo(() => getCartCount(items), [items]);

  return { items, add, updateQty, remove, clear, total, count };
}
