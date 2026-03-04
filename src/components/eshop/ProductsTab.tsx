import { Search, Plug } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { SearchItem } from "@/pages/seller/eshop-connect/EshopConnectPage";
import ProductCard from "./ProductCard";

interface Props {
  results: SearchItem[];
  searching: boolean;
  query: string;
  formatPrice: (cents: number | undefined, currency: string | undefined) => string;
  onProductClick: (item: SearchItem) => void;
  onSearch: (q: string) => void;
  hasConnectedProvider?: boolean;
  onGoToManufacturers?: () => void;
  providerWarnings?: string[];
  selectedProviderKey?: string;
  hasAttemptedProviderLoad?: boolean;
}

const SUGGESTIONS = [
  "Trending products this month",
  "Find viral TikTok items",
  "Products with 40% margin",
  "Find US warehouse suppliers",
  "Wireless earbuds under $20",
  "Phone accessories best sellers",
];

export default function ProductsTab({
  results,
  searching,
  query,
  formatPrice,
  onProductClick,
  onSearch,
  hasConnectedProvider = true,
  onGoToManufacturers,
  providerWarnings = [],
  selectedProviderKey,
  hasAttemptedProviderLoad = false,
}: Props) {
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const providerCounts = useMemo(() => {
    const counts = { cj: 0, moderndropship: 0, estores: 0 };

    for (const item of results) {
      const key = String(item.provider_key || "").toLowerCase();
      if (key === "cj") counts.cj += 1;
      if (key === "moderndropship") counts.moderndropship += 1;
      if (key === "estores" || key === "yangu_estores") counts.estores += 1;
    }

    return counts;
  }, [results]);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of results) {
      const cat = item.category_name || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [results]);

  const countries = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of results) {
      const country = item.ship_from_country || "Unknown";
      counts[country] = (counts[country] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [results]);

  const filteredResults = useMemo(() => {
    let filtered = results;
    if (selectedCategory) {
      filtered = filtered.filter((item) => (item.category_name || "Other") === selectedCategory);
    }
    if (selectedCountry) {
      filtered = filtered.filter((item) => (item.ship_from_country || "Unknown") === selectedCountry);
    }
    return filtered;
  }, [results, selectedCategory, selectedCountry]);

  return (
    <div className="flex min-h-0">
      <aside className="w-52 shrink-0 border-r border-border/40 p-4 space-y-5 hidden lg:block">
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Category</h4>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`block w-full text-left text-sm py-1 px-2 rounded transition-colors ${
                !selectedCategory ? "text-accent bg-accent/5 font-medium" : "text-foreground hover:text-accent hover:bg-accent/5"
              }`}
            >
              All categories
              {results.length > 0 && <span className="text-xs text-muted-foreground ml-1">({results.length})</span>}
            </button>
            {categories.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedCategory(c.name === selectedCategory ? null : c.name)}
                className={`block w-full text-left text-sm py-1 px-2 rounded transition-colors ${
                  selectedCategory === c.name ? "text-accent bg-accent/5 font-medium" : "text-foreground hover:text-accent hover:bg-accent/5"
                }`}
              >
                {c.name}
                <span className="text-xs text-muted-foreground ml-1">({c.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Price Range</h4>
          <div className="flex gap-2">
            <input placeholder="Min" className="w-full px-2 py-1.5 text-xs rounded border border-border bg-card text-foreground" />
            <input placeholder="Max" className="w-full px-2 py-1.5 text-xs rounded border border-border bg-card text-foreground" />
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ship From</h4>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCountry(null)}
              className={`block w-full text-left text-sm py-1 px-2 rounded transition-colors ${
                !selectedCountry ? "text-accent bg-accent/5 font-medium" : "text-foreground hover:text-accent hover:bg-accent/5"
              }`}
            >
              All countries
            </button>
            {countries.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedCountry(c.name === selectedCountry ? null : c.name)}
                className={`block w-full text-left text-sm py-1 px-2 rounded transition-colors ${
                  selectedCountry === c.name ? "text-accent bg-accent/5 font-medium" : "text-foreground hover:text-accent hover:bg-accent/5"
                }`}
              >
                {c.name}
                <span className="text-xs text-muted-foreground ml-1">({c.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="rounded border-border" />
            Verified suppliers only
          </label>
        </div>
      </aside>

      <div className="flex-1 p-5">
        {import.meta.env.DEV && (
          <div className="mb-2 text-[11px] text-muted-foreground">
            CJ: {providerCounts.cj} · ModernDropship: {providerCounts.moderndropship} · YANGU Estores: {providerCounts.estores}
          </div>
        )}

        {providerWarnings.length > 0 && (
          <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {Array.from(new Set(providerWarnings)).join(" · ")}
          </div>
        )}

        {!hasConnectedProvider && results.length === 0 && !searching ? (
          <div className="max-w-lg mx-auto py-16 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
              <Plug className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Connect a supplier to get started</h3>
              <p className="text-sm text-muted-foreground">
                Connect CJ Dropshipping or ModernDropship to browse and import products into your store.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button
                onClick={onGoToManufacturers}
                className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
              >
                <Plug className="w-4 h-4" />
                Connect a Supplier
              </Button>
            </div>
          </div>
        ) : searching ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card animate-pulse">
                <div className="aspect-square bg-muted rounded-t-lg" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredResults.length > 0 ? (
          <>
            {(selectedCategory || selectedCountry) && (
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Showing:</span>
                {selectedCategory && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-accent/10 text-accent font-medium">{selectedCategory}
                    <button onClick={() => setSelectedCategory(null)} className="ml-1 text-muted-foreground hover:text-foreground">✕</button>
                  </span>
                )}
                {selectedCountry && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-accent/10 text-accent font-medium">{selectedCountry}
                    <button onClick={() => setSelectedCountry(null)} className="ml-1 text-muted-foreground hover:text-foreground">✕</button>
                  </span>
                )}
                <button
                  onClick={() => { setSelectedCategory(null); setSelectedCountry(null); }}
                  className="text-xs text-accent hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredResults.map((item) => (
                <ProductCard
                  key={`${item.provider_key || "unknown"}:${item.external_product_id}`}
                  item={item}
                  formatPrice={formatPrice}
                  onClick={() => onProductClick(item)}
                />
              ))}
            </div>
          </>
        ) : results.length > 0 && (selectedCategory || selectedCountry) ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No products matching current filters</p>
            <button onClick={() => { setSelectedCategory(null); setSelectedCountry(null); }} className="text-sm text-accent hover:underline mt-2">Clear all filters</button>
          </div>
        ) : hasAttemptedProviderLoad && selectedProviderKey ? (
          <div className="max-w-xl mx-auto py-14 text-center space-y-4">
            <Search className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <div>
              <p className="text-sm text-foreground font-medium">
                {selectedProviderKey === "moderndropship"
                  ? "No ModernDropship products available for this account."
                  : selectedProviderKey === "estores"
                    ? "No YANGU Estores products available right now."
                    : "No CJ products found for this query."}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedProviderKey === "estores"
                  ? "Products will appear here once stores list items on Eshop Connect."
                  : "Try another query or provider."}
              </p>
            </div>
            {selectedProviderKey === "moderndropship" && (
              <Button onClick={onGoToManufacturers} variant="outline" className="gap-1.5">
                <Plug className="w-4 h-4" />
                Check connection / API key
              </Button>
            )}
          </div>
        ) : (
          <div className="max-w-xl mx-auto py-12">
            <div className="text-center mb-8">
              <Search className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Search for products to get started</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try "wireless earbuds" or "smart watch"</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSearch(s)}
                  className="px-4 py-2 rounded-xl border border-border/60 bg-card/60 text-sm text-muted-foreground hover:border-accent/40 hover:bg-accent/5 hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

