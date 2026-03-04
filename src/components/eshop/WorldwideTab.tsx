import { useMemo } from "react";
import type { SearchItem } from "@/pages/seller/eshop-connect/EshopConnectPage";
import ProductCard from "./ProductCard";
import { Globe } from "lucide-react";

const COUNTRY_FLAGS: Record<string, string> = {
  "United States": "🇺🇸",
  China: "🇨🇳",
  UAE: "🇦🇪",
  India: "🇮🇳",
  Vietnam: "🇻🇳",
  Indonesia: "🇮🇩",
  Malaysia: "🇲🇾",
  Türkiye: "🇹🇷",
  Pakistan: "🇵🇰",
  Thailand: "🇹🇭",
  "United Kingdom": "🇬🇧",
};

interface Props {
  selectedCountry: string;
  onCountryChange: (key: string) => void;
  results: SearchItem[];
  searching: boolean;
  formatPrice: (cents: number | undefined, currency: string | undefined) => string;
  onProductClick: (item: SearchItem) => void;
}

export default function WorldwideTab({ selectedCountry, onCountryChange, results, searching, formatPrice, onProductClick }: Props) {
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of results) {
      const country = (item.ship_from_country || "Unknown").trim();
      counts[country] = (counts[country] || 0) + 1;
    }
    return counts;
  }, [results]);

  const countries = useMemo(() => {
    const dynamic = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ key: label, label, count, flag: COUNTRY_FLAGS[label] || null }));
    return [{ key: "all", label: "All", count: results.length, flag: null }, ...dynamic];
  }, [countryCounts, results.length]);

  const filteredResults = useMemo(() => {
    if (selectedCountry === "all") return results;
    return results.filter((item) => (item.ship_from_country || "Unknown").trim() === selectedCountry);
  }, [results, selectedCountry]);

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {countries.map((c) => (
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
              <span className="ml-1 text-muted-foreground">({c.count})</span>
            </span>
            {selectedCountry === c.key && <div className="w-6 h-0.5 bg-accent rounded-full" />}
          </button>
        ))}
      </div>

      {selectedCountry !== "all" && (
        <div className="text-xs text-muted-foreground">
          Filter active: {selectedCountry}
          <button onClick={() => onCountryChange("all")} className="ml-2 text-accent hover:underline">Clear filters</button>
        </div>
      )}

      {filteredResults.length > 0 ? (
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
      ) : results.length > 0 && selectedCountry !== "all" ? (
        <div className="text-center py-16">
          <Globe className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No products found for {selectedCountry}</p>
          <button onClick={() => onCountryChange("all")} className="text-xs text-accent hover:underline mt-2">Clear filters</button>
        </div>
      ) : searching ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">Loading products…</p>
        </div>
      ) : (
        <div className="text-center py-16">
          <Globe className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Search for products and filter by region</p>
        </div>
      )}
    </div>
  );
}
