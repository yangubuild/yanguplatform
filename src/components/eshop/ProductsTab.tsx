import { Search, Package, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { SearchItem } from "@/pages/seller/eshop-connect/EshopConnectPage";
import ProductCard from "./ProductCard";

interface Props {
  results: SearchItem[];
  searching: boolean;
  query: string;
  formatPrice: (cents: number | undefined, currency: string | undefined) => string;
  onProductClick: (item: SearchItem) => void;
  onSearch: (q: string) => void;
}

const CATEGORIES = ["All categories", "Electronics", "Fashion", "Home & Garden", "Beauty", "Sports", "Toys"];
const SUGGESTIONS = [
  "Trending products this month",
  "Find viral TikTok items",
  "Products with 40% margin",
  "Find US warehouse suppliers",
  "Wireless earbuds under $20",
  "Phone accessories best sellers",
];

export default function ProductsTab({ results, searching, query, formatPrice, onProductClick, onSearch }: Props) {
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  return (
    <div className="flex min-h-0">
      {/* Left sidebar filters */}
      <aside className="w-52 shrink-0 border-r border-border/40 p-4 space-y-5 hidden lg:block">
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Category</h4>
          <div className="space-y-1">
            {CATEGORIES.map((c) => (
              <button key={c} className="block w-full text-left text-sm text-foreground hover:text-accent py-1 px-2 rounded hover:bg-accent/5 transition-colors">
                {c}
                <ChevronDown className="w-3 h-3 inline ml-1 text-muted-foreground" />
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
        {searching ? (
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
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.map((item) => (
              <ProductCard
                key={item.external_product_id}
                item={item}
                formatPrice={formatPrice}
                onClick={() => onProductClick(item)}
              />
            ))}
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
                  className="px-4 py-2 rounded-full border border-border bg-card text-sm text-foreground hover:border-accent/40 hover:bg-accent/5 transition-colors"
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
