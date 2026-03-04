import { useState, useCallback, useEffect } from "react";
import { Search, Sparkles, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AiModePopup from "@/components/eshop/AiModePopup";
import ProductsTab from "@/components/eshop/ProductsTab";
import ManufacturersTab from "@/components/eshop/ManufacturersTab";
import WorldwideTab from "@/components/eshop/WorldwideTab";
import MyImportsTab from "@/components/eshop/MyImportsTab";
import ProductDetailView from "@/components/eshop/ProductDetailView";

export interface SearchItem {
  external_product_id: string;
  title: string;
  thumbnail: string;
  images?: string[];
  provider_currency: string;
  provider_min_price_cents: number;
  provider_max_price_cents: number;
  display_currency?: string;
  display_min_price_cents?: number;
  display_max_price_cents?: number;
  provider_key?: string;
  [key: string]: unknown;
}

const SHOP_SURFACE_ID = "";

const TABS = [
  { key: "ai-mode", label: "AI Mode" },
  { key: "products", label: "Products" },
  { key: "manufacturers", label: "Manufacturers" },
  { key: "worldwide", label: "Worldwide" },
  { key: "my-imports", label: "My Imports" },
] as const;

type TabKey = typeof TABS[number]["key"];

const SOURCES = [
  { key: "cj", label: "CJ Dropshipping", enabled: true },
  { key: "moderndropship", label: "ModernDropship", enabled: true },
  { key: "estores", label: "YANGU Estores", enabled: true },
  { key: "dsers", label: "DSers", enabled: false },
];

export default function EshopConnectPage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("products");
  const [providerKey, setProviderKey] = useState("cj");
  const [selectedProduct, setSelectedProduct] = useState<SearchItem | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("all");

  useEffect(() => {
    const dismissed = localStorage.getItem("eshop_ai_popup_dismissed");
    if (!dismissed) setShowPopup(true);
  }, []);

  const dismissPopup = () => {
    setShowPopup(false);
    localStorage.setItem("eshop_ai_popup_dismissed", Date.now().toString());
  };

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await supabase.functions.invoke("dropship-search", {
        body: {
          provider_key: providerKey,
          query: q.trim(),
          shop_surface_id: SHOP_SURFACE_ID || undefined,
        },
      });
      if (res.error) throw new Error(res.error.message);
      const items = (res.data?.items || []).map((i: any) => ({
        ...i,
        provider_key: providerKey,
      }));
      setResults(items);
      if (items.length === 0) toast.info("No products found for that query.");
    } catch (err: any) {
      console.error(err);
      toast.error("Search failed — " + (err.message || "unknown error"));
    } finally {
      setSearching(false);
    }
  }, [providerKey]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const formatPrice = (cents: number | undefined, currency: string | undefined) => {
    if (cents == null || !currency) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(cents / 100);
  };

  if (selectedProduct) {
    return (
      <ProductDetailView
        product={selectedProduct}
        providerKey={selectedProduct.provider_key || providerKey}
        shopSurfaceId={SHOP_SURFACE_ID}
        formatPrice={formatPrice}
        onBack={() => setSelectedProduct(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* AI Mode Popup */}
      {showPopup && <AiModePopup onClose={dismissPopup} />}

      {/* Top Tab Navigation — Alibaba style */}
      <div className="border-b border-border/60 bg-card/50">
        <div className="flex items-center justify-center gap-6 py-3">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-sm font-semibold px-1 pb-1 transition-colors relative ${
                activeTab === tab.key
                  ? "text-accent border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.key === "ai-mode" && <Sparkles className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar — large, Alibaba-style */}
        {(activeTab === "products" || activeTab === "ai-mode" || activeTab === "worldwide") && (
          <div className="px-6 pb-4">
            <form onSubmit={handleSearch} className="relative max-w-4xl mx-auto rounded-xl border-2 border-accent/40 bg-card overflow-hidden">
              <div className="px-4 pt-3 pb-1">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={activeTab === "ai-mode" ? "Describe your needs..." : "Search products, suppliers, or niches..."}
                  className="w-full text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between px-4 pb-3">
                <button type="button" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Search className="w-3.5 h-3.5" /> Image Search
                </button>
                <Button type="submit" size="sm" disabled={searching} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-5 gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {searching ? "Searching…" : "Search"}
                </Button>
              </div>
            </form>

            {/* Source selector row */}
            <div className="flex items-center justify-center gap-2 mt-3">
              {SOURCES.map((s) => (
                <button
                  key={s.key}
                  disabled={!s.enabled}
                  onClick={() => s.enabled && setProviderKey(s.key)}
                  className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                    providerKey === s.key
                      ? "border-accent bg-accent/10 text-accent font-medium"
                      : s.enabled
                        ? "border-border text-muted-foreground hover:border-accent/40 hover:text-foreground"
                        : "border-border/40 text-muted-foreground/40 cursor-not-allowed"
                  }`}
                >
                  {s.label}{!s.enabled && " (soon)"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {(activeTab === "products" || activeTab === "ai-mode") && (
          <ProductsTab
            results={results}
            searching={searching}
            query={query}
            formatPrice={formatPrice}
            onProductClick={setSelectedProduct}
            onSearch={(q) => { setQuery(q); doSearch(q); }}
          />
        )}
        {activeTab === "manufacturers" && (
          <ManufacturersTab />
        )}
        {activeTab === "worldwide" && (
          <WorldwideTab
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
            results={results}
            searching={searching}
            formatPrice={formatPrice}
            onProductClick={setSelectedProduct}
          />
        )}
        {activeTab === "my-imports" && (
          <MyImportsTab />
        )}
      </div>
    </div>
  );
}
