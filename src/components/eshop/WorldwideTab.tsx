import { useMemo } from "react";
import type { SearchItem } from "@/pages/seller/eshop-connect/EshopConnectPage";
import ProductCard from "./ProductCard";
import { Globe } from "lucide-react";

const PINNED_COUNTRIES: Array<{ key: string; label: string; flag: string | null }> = [
  { key: "all", label: "All", flag: null },
  { key: "China", label: "China", flag: "🇨🇳" },
  { key: "United States", label: "United States", flag: "🇺🇸" },
  { key: "United Kingdom", label: "United Kingdom", flag: "🇬🇧" },
  { key: "UAE", label: "UAE", flag: "🇦🇪" },
  { key: "India", label: "India", flag: "🇮🇳" },
  { key: "Vietnam", label: "Vietnam", flag: "🇻🇳" },
  { key: "Indonesia", label: "Indonesia", flag: "🇮🇩" },
  { key: "Malaysia", label: "Malaysia", flag: "🇲🇾" },
  { key: "Türkiye", label: "Türkiye", flag: "🇹🇷" },
  { key: "Pakistan", label: "Pakistan", flag: "🇵🇰" },
  { key: "Thailand", label: "Thailand", flag: "🇹🇭" },
];

const PINNED_KEYS = new Set(PINNED_COUNTRIES.map((c) => c.key));

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

  // Build merged list: pinned countries + any dynamic countries from data
  const countries = useMemo(() => {
    const pinned = PINNED_COUNTRIES.map((c) => ({
      ...c,
      count: c.key === "all" ? results.length : (countryCounts[c.key] || 0),
    }));

    // Find countries in data that aren't in the pinned list
    const dynamicCountries: Array<{ key: string; label: string; flag: string | null; count: number }> = [];
    for (const [country, count] of Object.entries(countryCounts)) {
      if (!PINNED_KEYS.has(country) && country !== "Unknown") {
        dynamicCountries.push({ key: country, label: country, flag: null, count });
      }
    }
    // Sort dynamic by count desc
    dynamicCountries.sort((a, b) => b.count - a.count);

    // Add "Unknown" at the end if present
    if (countryCounts["Unknown"]) {
      dynamicCountries.push({ key: "Unknown", label: "Unknown", flag: "❓", count: countryCounts["Unknown"] });
    }

    return [...pinned, ...dynamicCountries];
  }, [countryCounts, results.length]);

  // Dev-only debug logging
  if (import.meta.env.DEV) {
    const top5 = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    console.log("[WorldwideTab] debug", { totalItems: results.length, top5Countries: top5 });
  }

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
      ) : searching ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">Loading products…</p>
        </div>
      ) : selectedCountry !== "all" ? (
        <div className="text-center py-16">
          <Globe className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No products shipping from {selectedCountry}</p>
          <button onClick={() => onCountryChange("all")} className="text-xs text-accent hover:underline mt-2">Clear filters</button>
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
