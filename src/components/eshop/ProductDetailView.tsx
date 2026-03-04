import { useState, useEffect } from "react";
import { ArrowLeft, Download, Loader2, Truck, ShieldCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SearchItem } from "@/pages/seller/eshop-connect/EshopConnectPage";

interface Props {
  product: SearchItem;
  providerKey: string;
  shopSurfaceId: string;
  formatPrice: (cents: number | undefined, currency: string | undefined) => string;
  onBack: () => void;
}

export default function ProductDetailView({ product, providerKey, shopSurfaceId, formatPrice, onBack }: Props) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [mainImage, setMainImage] = useState(product.thumbnail);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await supabase.functions.invoke("dropship-product", {
          body: {
            provider_key: providerKey,
            external_product_id: product.external_product_id,
            shop_surface_id: shopSurfaceId || undefined,
          },
        });
        if (res.error) throw new Error(res.error.message);
        const d = res.data?.product;
        setDetail(d);
        if (d?.images?.[0]) setMainImage(d.images[0]);
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    })();
  }, [product.external_product_id, providerKey]);

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

  const images: string[] = detail?.images || product?.images || [product.thumbnail];
  const variants: any[] = detail?.variants || [];

  const displayPrice = detail?.display_base_price_cents != null
    ? formatPrice(detail.display_base_price_cents, detail.display_currency)
    : formatPrice(product.display_min_price_cents ?? product.provider_min_price_cents, product.display_currency ?? product.provider_currency);

  const providerPrice = detail?.provider_base_price_cents != null
    ? formatPrice(detail.provider_base_price_cents, detail.provider_currency)
    : null;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Back header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border/60">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-semibold text-foreground truncate">{product.title}</h2>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Thumbnail strip */}
              <div className="lg:col-span-1 flex lg:flex-col gap-2 order-2 lg:order-1">
                {images.slice(0, 6).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setMainImage(img)}
                    className={`w-14 h-14 rounded-md border overflow-hidden shrink-0 ${mainImage === img ? "border-accent" : "border-border"}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>

              {/* Center: Main image */}
              <div className="lg:col-span-5 order-1 lg:order-2">
                <div className="aspect-square rounded-xl border border-border bg-muted overflow-hidden">
                  <img src={mainImage} alt={product.title} className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Right: Purchase panel */}
              <div className="lg:col-span-6 order-3 space-y-5">
                <div>
                  <p className="text-lg font-bold text-foreground">{product.title}</p>
                  <div className="flex items-baseline gap-3 mt-2">
                    <span className="text-2xl font-bold text-accent">{displayPrice}</span>
                    {providerPrice && (
                      <span className="text-sm text-muted-foreground line-through">{providerPrice}</span>
                    )}
                  </div>
                </div>

                {/* Variants */}
                {variants.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Variations ({variants.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((v: any, i: number) => (
                        <div key={i} className="px-3 py-1.5 text-xs rounded-lg border border-border bg-muted/30 text-foreground">
                          {v.name || v.variant_name || `Variant ${i + 1}`}
                          <span className="ml-2 text-accent font-medium">
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

                {/* Shipping block */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Shipping</h4>
                    <button className="text-xs text-accent flex items-center gap-0.5">
                      Change <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Truck className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">Standard Logistics</p>
                      <p className="text-xs">Estimated delivery by 7–14 business days</p>
                    </div>
                  </div>
                </div>

                {/* Dropship to store block */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Dropship this product to your store</h4>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleImport}
                      disabled={importing || imported}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-6 gap-1.5"
                    >
                      {imported ? "✓ Imported" : importing ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing…</>
                      ) : (
                        <><Download className="w-3.5 h-3.5" /> Import to my store</>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Order protection */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Order protection</h4>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground font-medium">Secure payments</p>
                      <p>All transactions secured with encryption</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground font-medium">Money-back protection</p>
                      <p>Refund if order doesn't ship or arrives with issues</p>
                    </div>
                  </div>
                </div>

                {/* FX info */}
                {detail?.fx_rate_used && (
                  <p className="text-[11px] text-muted-foreground/60">
                    FX rate: {Number(detail.fx_rate_used).toFixed(4)} • as of {detail.fx_as_of ? new Date(detail.fx_as_of).toLocaleDateString() : "—"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
