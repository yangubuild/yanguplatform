/**
 * PublicWishlistDrawer — Visitor-side wishlist drawer.
 *
 * Reads wishlist items from localStorage (key: `yangu_wishlist_${surfaceId}`).
 * Each item: { id, name, price_cents, currency, image_url }.
 *
 * Hooks into the existing cart via `window.__yangu_add_to_cart` to "Move to Bag".
 * Listens for `yangu_open_wishlist` postMessage from the iframe and a
 * `yangu_wishlist_changed` window event to refresh the count.
 */
import { useEffect, useState, useCallback } from "react";
import { Heart, Trash2, ShoppingBag } from "lucide-react";

export interface WishlistItem {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  image_url: string | null;
}

interface PublicWishlistDrawerProps {
  surfaceId: string;
  open: boolean;
  onClose: () => void;
  onMoveToBag?: (item: WishlistItem) => void;
}

const wishlistKey = (surfaceId: string) => `yangu_wishlist_${surfaceId}`;

export function readWishlist(surfaceId: string): WishlistItem[] {
  try {
    const raw = localStorage.getItem(wishlistKey(surfaceId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeWishlist(surfaceId: string, items: WishlistItem[]) {
  try {
    localStorage.setItem(wishlistKey(surfaceId), JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("yangu_wishlist_changed", { detail: { surfaceId, count: items.length } }));
  } catch {
    /* ignore quota errors */
  }
}

export function formatPrice(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(0)}`;
  }
}

export function PublicWishlistDrawer({ surfaceId, open, onClose, onMoveToBag }: PublicWishlistDrawerProps) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  const refresh = useCallback(() => {
    setItems(readWishlist(surfaceId));
  }, [surfaceId]);

  useEffect(() => {
    if (!open) return;
    refresh();
  }, [open, refresh]);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener("yangu_wishlist_changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("yangu_wishlist_changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const remove = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    writeWishlist(surfaceId, next);
    setItems(next);
  };

  const moveToBag = (item: WishlistItem) => {
    onMoveToBag?.(item);
    remove(item.id);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex" role="dialog" aria-modal="true">
      <button aria-label="Close wishlist" className="flex-1 bg-black/50" onClick={onClose} />
      <aside className="w-full max-w-md bg-background h-full flex flex-col shadow-2xl">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" fill="currentColor" />
            <h2 className="text-base font-semibold">Wishlist</h2>
            <span className="text-sm text-muted-foreground">({items.length})</span>
          </div>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Heart className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-sm">Your wishlist is empty.</p>
              <p className="text-xs mt-1">Tap the heart on any product to save it here.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-sm text-foreground/80 mt-1">{formatPrice(item.price_cents, item.currency)}</p>
                    <div className="mt-auto flex items-center gap-2 pt-2">
                      <button
                        onClick={() => moveToBag(item)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:opacity-90"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" /> Move to Bag
                      </button>
                      <button
                        onClick={() => remove(item.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
