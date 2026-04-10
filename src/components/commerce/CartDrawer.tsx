/**
 * CartDrawer — Slide-out cart panel for public surface pages.
 * Works across emenu, eshop, estore.
 */

import { X, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPriceCents } from "@/types/commerce";
import type { CartItem } from "@/lib/cart/cartStore";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: string;
  totalCents: number;
  onUpdateQty: (itemId: string, qty: number, variant?: string | null) => void;
  onRemove: (itemId: string, variant?: string | null) => void;
  onCheckout: () => void;
  deliveryFeeCents?: number;
}

export function CartDrawer({
  open, onClose, items, currency, totalCents, onUpdateQty, onRemove, onCheckout, deliveryFeeCents = 0,
}: CartDrawerProps) {
  if (!open) return null;

  const subtotal = totalCents;
  const grandTotal = subtotal + deliveryFeeCents;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background shadow-xl flex flex-col animate-in slide-in-from-right-full duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
          ) : (
            items.map((item) => (
              <div key={`${item.id}-${item.variant || ""}`} className="flex gap-3 border-b pb-3">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  {item.variant && <p className="text-xs text-muted-foreground">{item.variant}</p>}
                  <p className="text-sm font-semibold mt-1">
                    {formatPriceCents(item.price_cents, currency)} each
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => onUpdateQty(item.id, item.quantity - 1, item.variant)}
                      className="p-1 rounded bg-foreground text-background hover:opacity-80"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQty(item.id, item.quantity + 1, item.variant)}
                      className="p-1 rounded bg-foreground text-background hover:opacity-80"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(item.id, item.variant)}
                  className="text-destructive hover:text-destructive/80 self-start p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPriceCents(subtotal, currency)}</span>
            </div>
            {deliveryFeeCents > 0 && (
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>{formatPriceCents(deliveryFeeCents, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t">
              <span>Total</span>
              <span>{formatPriceCents(grandTotal, currency)}</span>
            </div>
            <Button onClick={onCheckout} className="w-full mt-2" size="lg">
              Proceed to Checkout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
