import { Search, Package, SlidersHorizontal, ChevronDown, Plug } from "lucide-react";
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
}

const SUGGESTIONS = [
  "Trending products this month",
  "Find viral TikTok items",
  "Products with 40% margin",
  "Find US warehouse suppliers",
  "Wireless earbuds under $20",
  "Phone accessories best sellers",
];

export default function ProductsTab({ results, searching, query, formatPrice, onProductClick, onSearch, hasConnectedProvider = true, onGoToManufacturers }: Props) {
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Build dynamic categories from results
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

  // Filter results by selected category
  const filteredResults = useMemo(() => {
    if (!selectedCategory) return results;
    return results.filter((item) => (item.category_name || "Other") === selectedCategory);
  }, [results, selectedCategory]);

  return (
    <div className="flex min-h-0">
      {/* Left sidebar filters */}
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
            {["China", "US", "EU", "UAE"].map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm text-foreground cursor-pointer py-0.5">
                <input type="checkbox" className="rounded border-border" />
                {r}
              </label>
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

      {/* Main content */}
      <div className="flex-1 p-5">
        {!hasConnectedProvider && results.length === 0 && !searching ? (
          /* Empty state — no providers connected */
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
            {selectedCategory && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Showing:</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-accent/10 text-accent font-medium">{selectedCategory}</span>
                <button onClick={() => setSelectedCategory(null)} className="text-xs text-muted-foreground hover:text-foreground">✕ Clear</button>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredResults.map((item) => (
                <ProductCard
                  key={item.external_product_id}
                  item={item}
                  formatPrice={formatPrice}
                  onClick={() => onProductClick(item)}
                />
              ))}
            </div>
          </>
        ) : results.length > 0 && selectedCategory ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No products in "{selectedCategory}"</p>
            <button onClick={() => setSelectedCategory(null)} className="text-sm text-accent hover:underline mt-2">Show all results</button>
          </div>
        ) : (
          <div className="max-w-xl mx-auto py-12">
            {/* Welcome / suggestion chips when no results */}
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
