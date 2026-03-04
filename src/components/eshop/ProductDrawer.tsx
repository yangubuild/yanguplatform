import { useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  product: any;
  providerKey: string;
  shopSurfaceId: string;
  formatPrice: (cents: number | undefined, currency: string | undefined) => string;
}

export default function ProductDrawer({ open, onClose, product, providerKey, shopSurfaceId, formatPrice }: Props) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  // Fetch full detail when opened
  const fetchDetail = async () => {
    if (!product) return;
    setLoading(true);
    setDetail(null);
    setImported(false);
    try {
      const res = await supabase.functions.invoke("dropship-product", {
        body: {
          provider_key: providerKey,
          external_product_id: product.external_product_id,
          shop_surface_id: shopSurfaceId || undefined,
        },
      });
      if (res.error) throw new Error(res.error.message);
      setDetail(res.data?.product || null);
    } catch (err: any) {
      toast.error("Failed to load product details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when opened
  if (open && product && !detail && !loading) {
    fetchDetail();
  }

  // Reset on close
  const handleClose = () => {
    setDetail(null);
    setImported(false);
    onClose();
  };

  const handleImport = async () => {
    if (!shopSurfaceId) {
      toast.error("Connect your store first to import products.");
      return;
    }
    setImporting(true);
    try {
      const res = await supabase.functions.invoke("dropship-import", {
        body: {
          provider_key: providerKey,
          external_product_id: product.external_product_id,
          shop_surface_id: shopSurfaceId,
        },
      });
      if (res.error) throw new Error(res.error.message);
      setImported(true);
      toast.success("✓ Product Imported");
    } catch (err: any) {
      toast.error("Import failed — " + (err.message || "unknown error"));
    } finally {
      setImporting(false);
    }
  };

  if (!open) return null;

  const d = detail;
  const images: string[] = d?.images || product?.images || [];
  const variants: any[] = d?.variants || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <h2 className="text-sm font-semibold text-foreground truncate pr-4">{product?.title || "Product Detail"}</h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : (
            <>
              {/* Images */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.slice(0, 6).map((img, i) => (
                    <img key={i} src={img} alt="" className="w-full aspect-square object-cover rounded-md border border-border" loading="lazy" />
                  ))}
                </div>
              )}

              {/* Price */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Display Price</p>
                <p className="text-lg font-semibold text-accent">
                  {d?.display_base_price_cents != null
                    ? formatPrice(d.display_base_price_cents, d.display_currency)
                    : formatPrice(d?.provider_base_price_cents || product?.provider_min_price_cents, d?.provider_currency || product?.provider_currency)
                  }
                </p>
                {d?.provider_base_price_cents != null && d?.display_base_price_cents != null && (
                  <p className="text-xs text-muted-foreground">
                    Provider cost: {formatPrice(d.provider_base_price_cents, d.provider_currency)}
                  </p>
                )}
              </div>

              {/* Variants */}
              {variants.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Variants ({variants.length})</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {variants.map((v: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2.5 py-1.5">
                        <span className="text-foreground truncate mr-2">{v.name || v.variant_name || `Variant ${i + 1}`}</span>
                        <span className="text-accent font-medium shrink-0">
                          {v.display_price_cents != null
                            ? formatPrice(v.display_price_cents, v.display_currency)
                            : formatPrice(v.provider_price_cents, v.provider_currency)
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra info */}
              {d?.fx_rate_used && (
                <p className="text-[11px] text-muted-foreground/60">
                  FX rate: {Number(d.fx_rate_used).toFixed(4)} • as of {d.fx_as_of ? new Date(d.fx_as_of).toLocaleDateString() : "—"}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border/60 flex gap-2">
          <Button variant="outline" size="sm" onClick={handleClose} className="flex-1 text-xs">
            Close
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={importing || imported || !shopSurfaceId}
            className="flex-1 text-xs bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
          >
            {imported ? "✓ Imported" : importing ? <><Loader2 className="w-3 h-3 animate-spin" /> Importing…</> : <><Download className="w-3 h-3" /> Import to Store</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
