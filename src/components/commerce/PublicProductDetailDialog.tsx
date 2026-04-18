/**
 * PublicProductDetailDialog — Visitor-side product detail popup.
 *
 * Opened by clicking any [data-product-card="true"] in the published runtime.
 * Reads metadata from the card via postMessage payload from the iframe bridge.
 *
 * Surfaces: emenu shows simple add; eshop/estore show size & color selectors.
 */
import { useEffect, useState } from "react";
import { Heart, Minus, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice, readWishlist, writeWishlist } from "./PublicWishlistDrawer";

export interface ProductDetailPayload {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  price_cents: number;
  currency: string;
  image_urls: string[];
  sizes?: string[];
  colors?: string[];
  button_text?: string;
}

interface PublicProductDetailDialogProps {
  surfaceId: string;
  surfaceType?: string;
  product: ProductDetailPayload | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (product: ProductDetailPayload, opts: { size?: string; color?: string; quantity: number }) => void;
}

export function PublicProductDetailDialog({
  surfaceId,
  surfaceType,
  product,
  open,
  onClose,
  onAddToCart,
}: PublicProductDetailDialogProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const [size, setSize] = useState<string | undefined>();
  const [color, setColor] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);

  const isCommerce = surfaceType === "eshop" || surfaceType === "estore";

  useEffect(() => {
    if (!product) return;
    setImgIdx(0);
    setSize(product.sizes?.[0]);
    setColor(product.colors?.[0]);
    setQty(1);
    const list = readWishlist(surfaceId);
    setWished(list.some((i) => i.id === product.id));
  }, [product, surfaceId]);

  if (!open || !product) return null;

  const images = product.image_urls.length > 0 ? product.image_urls : [""];
  const hasMultiple = images.length > 1;

  const toggleWishlist = () => {
    const list = readWishlist(surfaceId);
    const exists = list.some((i) => i.id === product.id);
    const next = exists
      ? list.filter((i) => i.id !== product.id)
      : [...list, { id: product.id, name: product.name, price_cents: product.price_cents, currency: product.currency, image_url: images[0] || null }];
    writeWishlist(surfaceId, next);
    setWished(!exists);
  };

  const handleAdd = () => {
    onAddToCart(product, { size, color, quantity: qty });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-background shadow-2xl flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image side */}
        <div className="relative bg-muted md:w-1/2 aspect-square md:aspect-auto">
          {images[imgIdx] ? (
            <img src={images[imgIdx]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
          )}
          <button
            onClick={toggleWishlist}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow-md transition-transform hover:scale-110"
          >
            <Heart className={`h-4 w-4 ${wished ? "fill-red-500 text-red-500" : "text-foreground"}`} />
          </button>
          {hasMultiple && (
            <>
              <button
                onClick={() => setImgIdx((p) => (p - 1 + images.length) % images.length)}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/85 hover:bg-background flex items-center justify-center shadow"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setImgIdx((p) => (p + 1) % images.length)}
                aria-label="Next image"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/85 hover:bg-background flex items-center justify-center shadow"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === imgIdx ? "bg-foreground" : "bg-foreground/40"}`} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Info side */}
        <div className="md:w-1/2 flex flex-col overflow-y-auto">
          <div className="flex items-start justify-between p-5 border-b border-border">
            <div className="min-w-0">
              {product.brand && (
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{product.brand}</p>
              )}
              <h2 className="text-lg font-semibold text-foreground">{product.name}</h2>
              <p className="text-base font-bold text-foreground mt-1">{formatPrice(product.price_cents, product.currency)}</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="ml-3 p-1 rounded hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 p-5 space-y-5">
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {isCommerce && product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`min-w-[40px] h-9 px-3 rounded-md border text-sm font-medium transition-colors ${
                        size === s ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground hover:border-foreground/60"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isCommerce && product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      aria-label={`Color ${c}`}
                      className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        color === c ? "border-foreground scale-110" : "border-border"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantity</p>
              <div className="inline-flex items-center rounded-md border border-border">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="h-9 w-9 flex items-center justify-center hover:bg-muted"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="h-9 w-9 flex items-center justify-center hover:bg-muted"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-border">
            <button
              onClick={handleAdd}
              className="w-full rounded-lg bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {product.button_text || "+ Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
