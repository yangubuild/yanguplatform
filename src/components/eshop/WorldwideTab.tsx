import type { SearchItem } from "@/pages/seller/eshop-connect/EshopConnectPage";
import ProductCard from "./ProductCard";
import { Globe } from "lucide-react";

const COUNTRIES = [
  { key: "all", label: "All", flag: null },
  { key: "us", label: "United States", flag: "🇺🇸" },
  { key: "cn", label: "China", flag: "🇨🇳" },
  { key: "ae", label: "UAE", flag: "🇦🇪" },
  { key: "in", label: "India", flag: "🇮🇳" },
  { key: "vn", label: "Vietnam", flag: "🇻🇳" },
  { key: "id", label: "Indonesia", flag: "🇮🇩" },
  { key: "my", label: "Malaysia", flag: "🇲🇾" },
  { key: "tr", label: "Türkiye", flag: "🇹🇷" },
  { key: "pk", label: "Pakistan", flag: "🇵🇰" },
  { key: "th", label: "Thailand", flag: "🇹🇭" },
];

interface Props {
  selectedCountry: string;
  onCountryChange: (key: string) => void;
  results: SearchItem[];
  searching: boolean;
  formatPrice: (cents: number | undefined, currency: string | undefined) => string;
  onProductClick: (item: SearchItem) => void;
}

export default function WorldwideTab({ selectedCountry, onCountryChange, results, searching, formatPrice, onProductClick }: Props) {
  return (
    <div className="p-5 space-y-5">
      {/* Country chips row */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {COUNTRIES.map((c) => (
          <button
            key={c.key}
            onClick={() => onCountryChange(c.key)}
            className={`flex flex-col items-center gap-1.5 shrink-0 min-w-[64px] ${
              selectedCountry === c.key ? "opacity-100" : "opacity-60 hover:opacity-80"
            }`}
          >
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl ${
              selectedCountry === c.key ? "border-accent bg-accent/10" : "border-border bg-card"
            }`}>
              {c.flag || <Globe className="w-5 h-5 text-muted-foreground" />}
            </div>
            <span className={`text-[11px] text-center leading-tight ${
              selectedCountry === c.key ? "text-foreground font-semibold" : "text-muted-foreground"
            }`}>
              {c.label}
            </span>
            {selectedCountry === c.key && (
              <div className="w-6 h-0.5 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Results (shared with products search) */}
      {results.length > 0 ? (
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
        <div className="text-center py-16">
          <Globe className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Search for products and filter by region</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Use the search bar above to find products from {COUNTRIES.find(c => c.key === selectedCountry)?.label || "all regions"}</p>
        </div>
      )}
    </div>
  );
}
