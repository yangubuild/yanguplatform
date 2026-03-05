import { useState, useEffect } from "react";
import { ArrowLeft, Download, Loader2, Truck, ShieldCheck, ChevronRight, ChevronDown, Percent, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SearchItem } from "@/pages/seller/eshop-connect/EshopConnectPage";
import type { SurfaceWithPublishes } from "@/hooks/useSurfaces";

// Surface type display labels + eligibility
const SURFACE_TYPE_CONFIG: Record<string, { label: string; eligible: boolean }> = {
  shop: { label: "Eshop", eligible: true },
  eshop: { label: "Eshop", eligible: true },
  store_listing: { label: "Store", eligible: true },
  live_selling: { label: "Live Selling", eligible: false },
  live_bio: { label: "Live Bio", eligible: false },
  community: { label: "Community", eligible: false },
  community_group: { label: "Community", eligible: false },
  influencer: { label: "Influencer", eligible: false },
  esite: { label: "Website", eligible: false },
};

function getSurfaceLabel(s: SurfaceWithPublishes) {
  const config = SURFACE_TYPE_CONFIG[s.surface_type];
  const typeLabel = config?.label || s.surface_type;
  return `${s.title || "Untitled"} — ${typeLabel}`;
}

function isSurfaceEligible(s: SurfaceWithPublishes) {
  const config = SURFACE_TYPE_CONFIG[s.surface_type];
  return config?.eligible ?? false;
}

interface Props {
  product: SearchItem;
  providerKey: string;
  shopSurfaceId: string;
  formatPrice: (cents: number | undefined, currency: string | undefined) => string;
  onBack: () => void;
  allSurfaces?: SurfaceWithPublishes[];
  shopSurfaces?: SurfaceWithPublishes[];
  onShopSurfaceChange?: (id: string) => void;
}

export default function ProductDetailView({ product, providerKey, shopSurfaceId, formatPrice, onBack, allSurfaces, shopSurfaces = [], onShopSurfaceChange }: Props) {
  // Deduplicate surfaces by id
  const rawSurfaces = allSurfaces || shopSurfaces;
  const surfaces = rawSurfaces.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [mainImage, setMainImage] = useState(product.thumbnail);
  const [localShopId, setLocalShopId] = useState(shopSurfaceId || "");
  const [markupPercent, setMarkupPercent] = useState(30);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(new Set());

  // Auto-select first eligible surface
  useEffect(() => {
    if (!localShopId && surfaces.length > 0) {
      const firstEligible = surfaces.find(isSurfaceEligible);
      if (firstEligible) {
        setLocalShopId(firstEligible.id);
        onShopSurfaceChange?.(firstEligible.id);
      }
    }
  }, [surfaces]);

  const fetchDetail = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await supabase.functions.invoke("dropship-product", {
        body: {
          provider_key: providerKey,
          external_product_id: product.external_product_id,
          shop_surface_id: localShopId || undefined,
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error.message || "Provider error");
      const d = res.data?.product;
      setDetail(d);
      if (d?.images?.[0]) setMainImage(d.images[0]);
    } catch (err: any) {
      console.error("dropship-product fetch error", err);
      setFetchError(err.message || "Failed to load product details");
      toast.error("Couldn't load product details. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [product.external_product_id, providerKey]);

  // Pricing — use detail if available, fall back to search-level data
  const supplierCostCents = (detail?.provider_base_price_cents && detail.provider_base_price_cents > 0)
    ? detail.provider_base_price_cents
    : (product.provider_min_price_cents && product.provider_min_price_cents > 0)
      ? product.provider_min_price_cents
      : 0;
  const supplierCurrency = detail?.provider_currency ?? product.provider_currency ?? "USD";
  const sellingPriceCents = Math.round(supplierCostCents * (1 + markupPercent / 100));
  const displayCurrency = detail?.display_currency ?? product.display_currency ?? supplierCurrency;

  const handleImport = async () => {
    const destSurface = surfaces.find(s => s.id === localShopId);
    if (!localShopId || !destSurface) {
      toast.error("Select a destination to import this product.");
      return;
    }
    if (!isSurfaceEligible(destSurface)) {
      toast.error("This destination type doesn't support imports yet.");
      return;
    }
    setImporting(true);
    try {
      const res = await supabase.functions.invoke("dropship-import", {
        body: {
          provider_key: providerKey,
          external_product_id: product.external_product_id,
          shop_surface_id: localShopId,
          markup_percent: markupPercent,
          selling_price_cents: sellingPriceCents,
          // Pass search-level data as fallback for providers with stub getProduct
          fallback_title: product.title,
          fallback_price: product.provider_min_price_cents ? product.provider_min_price_cents / 100 : 0,
          fallback_currency: product.provider_currency || "USD",
          fallback_images: product.images || [product.thumbnail].filter(Boolean),
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error.message || "Import failed");
      setImported(true);
      const shopName = destSurface.title || "your shop";
      toast.success(`✓ Imported to ${shopName}`);
    } catch (err: any) {
      toast.error("Import failed — " + (err.message || "unknown error"));
    } finally {
      setImporting(false);
    }
  };

  const images: string[] = detail?.images?.length > 0 ? detail.images : (product?.images?.length > 0 ? product.images : [product.thumbnail].filter(Boolean));
  const variants: any[] = detail?.variants || [];

  // Auto-select all variants when they load
  useEffect(() => {
    if (variants.length > 0 && selectedVariants.size === 0) {
      setSelectedVariants(new Set(variants.map((_, i) => i)));
    }
  }, [variants.length]);

  const toggleVariant = (i: number) => {
    setSelectedVariants(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const toggleAllVariants = () => {
    if (selectedVariants.size === variants.length) {
      setSelectedVariants(new Set());
    } else {
      setSelectedVariants(new Set(variants.map((_, i) => i)));
    }
  };

  const displayPrice = supplierCostCents > 0
    ? formatPrice(sellingPriceCents, displayCurrency)
    : "$0.00";

  const providerPrice = supplierCostCents > 0
    ? formatPrice(supplierCostCents, supplierCurrency)
    : null;

  // Group surfaces by type for the picker
  const groupedSurfaces = surfaces.reduce<Record<string, SurfaceWithPublishes[]>>((acc, s) => {
    const config = SURFACE_TYPE_CONFIG[s.surface_type];
    const group = config?.label || s.surface_type;
    if (!acc[group]) acc[group] = [];
    acc[group].push(s);
    return acc;
  }, {});

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
      ) : fetchError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-sm text-destructive">{fetchError}</p>
          <Button variant="outline" size="sm" onClick={fetchDetail} className="gap-1.5">
            Retry
          </Button>
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
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Variations ({selectedVariants.size}/{variants.length} selected)
                      </p>
                      <button
                        onClick={toggleAllVariants}
                        className="text-xs text-accent hover:underline"
                      >
                        {selectedVariants.size === variants.length ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                      {variants.map((v: any, i: number) => {
                        const isSelected = selectedVariants.has(i);
                        return (
                          <button
                            key={i}
                            onClick={() => toggleVariant(i)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                              isSelected
                                ? "border-accent bg-accent/15 text-foreground"
                                : "border-border/50 bg-muted/20 text-muted-foreground"
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                              isSelected ? "bg-accent border-accent" : "border-muted-foreground/40"
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-accent-foreground" />}
                            </span>
                            <span className="truncate max-w-[200px]">
                              {v.name || v.variant_name || `Variant ${i + 1}`}
                            </span>
                            <span className="text-accent font-medium shrink-0">
                              {v.display_price_cents != null
                                ? formatPrice(v.display_price_cents, v.display_currency)
                                : formatPrice(v.provider_price_cents, v.provider_currency)
                              }
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Markup / Pricing Controls */}
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-accent" />
                    <h4 className="text-sm font-semibold text-foreground">Pricing & Markup</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Supplier Cost</Label>
                      <div className="px-3 py-2 text-sm rounded-lg border border-border bg-muted/40 text-foreground font-medium">
                        {formatPrice(supplierCostCents, supplierCurrency)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Markup %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={500}
                        value={markupPercent}
                        onChange={(e) => setMarkupPercent(Math.max(0, Number(e.target.value)))}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Your Selling Price</Label>
                      <div className="px-3 py-2 text-sm rounded-lg border border-accent/40 bg-accent/10 text-accent font-bold">
                        {formatPrice(sellingPriceCents, displayCurrency)}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70">
                    Margin: {formatPrice(sellingPriceCents - supplierCostCents, displayCurrency)} per unit
                  </p>
                </div>

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

                {/* Import to destination block */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Import to your shop</h4>

                  {surfaces.length > 0 ? (
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Destination shop</label>
                      <div className="relative">
                        <select
                          value={localShopId}
                          onChange={(e) => {
                            setLocalShopId(e.target.value);
                            onShopSurfaceChange?.(e.target.value);
                          }}
                          className="w-full appearance-none px-3 py-2 pr-8 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-accent/60"
                        >
                          <option value="">Select a shop…</option>
                          {Object.entries(groupedSurfaces).map(([groupLabel, items]) => (
                            <optgroup key={groupLabel} label={groupLabel}>
                              {items.map((s) => {
                                const eligible = isSurfaceEligible(s);
                                return (
                                  <option key={s.id} value={s.id} disabled={!eligible}>
                                    {s.title || "Untitled"}{!eligible ? " (coming soon)" : ""}
                                  </option>
                                );
                              })}
                            </optgroup>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Create a business surface first to import products.</p>
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleImport}
                      disabled={importing || imported || !localShopId}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-6 gap-1.5"
                    >
                      {imported ? "✓ Imported" : importing ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing…</>
                      ) : (
                        <><Download className="w-3.5 h-3.5" /> Import to my shop</>
                      )}
                    </Button>
                  </div>

                  {imported && (
                    <p className="text-xs text-accent">
                      Product imported! Check My Imports tab or edit pricing in your Shop editor.
                    </p>
                  )}
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
