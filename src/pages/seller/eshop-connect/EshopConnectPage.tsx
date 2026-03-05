import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Sparkles, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AiModePopup from "@/components/eshop/AiModePopup";
import ProductsTab from "@/components/eshop/ProductsTab";
import ManufacturersTab from "@/components/eshop/ManufacturersTab";
import WorldwideTab from "@/components/eshop/WorldwideTab";
import MyImportsTab from "@/components/eshop/MyImportsTab";
import ProductDetailView from "@/components/eshop/ProductDetailView";
import { useDropshipConnections } from "@/hooks/useDropshipConnections";
import { useSurfaces } from "@/hooks/useSurfaces";

export interface SearchItem {
  external_product_id: string;
  title: string;
  thumbnail: string;
  thumbnail_url?: string | null;
  image_urls?: string[];
  images?: string[];
  provider_currency: string;
  provider_min_price_cents: number;
  provider_max_price_cents: number;
  display_currency?: string;
  display_min_price_cents?: number;
  display_max_price_cents?: number;
  provider_key?: string;
  category_name?: string;
  ship_from_country?: string;
  [key: string]: unknown;
}

const SHOP_SURFACE_ID = ""; // legacy fallback — now uses picker

const TABS = [
  { key: "ai-mode", label: "AI Mode" },
  { key: "products", label: "Products" },
  { key: "manufacturers", label: "Manufacturers" },
  { key: "worldwide", label: "Worldwide" },
  { key: "my-imports", label: "My Imports" },
] as const;

type TabKey = typeof TABS[number]["key"];

const ALL_SOURCES = [
  { key: "cj", label: "CJ Dropshipping" },
  { key: "moderndropship", label: "ModernDropship" },
  { key: "estores", label: "YANGU Estores" },
  { key: "dsers", label: "DSers" },
];

export default function EshopConnectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shopSurfaceIdParam = searchParams.get("shop_surface_id") || "";

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("products");
  const [providerKey, setProviderKey] = useState("cj");
  const [selectedProduct, setSelectedProduct] = useState<SearchItem | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [hasAttemptedProviderLoad, setHasAttemptedProviderLoad] = useState(false);
  const [selectedShopSurfaceId, setSelectedShopSurfaceId] = useState(shopSurfaceIdParam);
  const [providerWarnings, setProviderWarnings] = useState<string[]>([]);

  const { isConnected, connectedProviders, isLoading: connectionsLoading } = useDropshipConnections();
  const { data: surfaces } = useSurfaces();

  // Get user's .shop surfaces for import destination picker
  const shopSurfaces = (surfaces || []).filter((s) => s.surface_type === "shop" && !s.archived_at);

  useEffect(() => {
    const dismissed = localStorage.getItem("eshop_ai_popup_dismissed");
    if (!dismissed) setShowPopup(true);
  }, []);

  const dismissPopup = () => {
    setShowPopup(false);
    localStorage.setItem("eshop_ai_popup_dismissed", Date.now().toString());
  };

  const normalizeProviderKey = (value?: string) => {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "yangu_estores") return "estores";
    return normalized;
  };

  const doSearch = useCallback(async (rawQuery: string, provider?: string) => {
    const pk = normalizeProviderKey(provider || providerKey);
    const effectiveQuery = rawQuery.trim() || "trending best sellers";

    if (!pk) {
      toast.info("Select a provider first.");
      return;
    }

    if (pk !== "estores" && !isConnected(pk)) {
      toast.info(`Connect ${pk === "cj" ? "CJ Dropshipping" : "ModernDropship"} in the Manufacturers tab first.`);
      setActiveTab("manufacturers");
      return;
    }

    setSearching(true);
    setResults([]);
    setProviderWarnings([]);
    setHasAttemptedProviderLoad(true);
    setSelectedCountry("all");

    try {
      const res = await supabase.functions.invoke("dropship-search", {
        body: {
          provider_key: pk,
          query: effectiveQuery,
          shop_surface_id: selectedShopSurfaceId || undefined,
        },
      });

      // Handle edge function transport errors gracefully (502, 429, etc.)
      if (res.error) {
        const errorMsg = res.error.message || "Unknown error";
        console.warn("dropship-search returned error:", errorMsg);
        // Check if response data still has items (graceful degradation)
        if (!res.data?.items) {
          setProviderWarnings([`Provider temporarily unavailable: ${errorMsg}`]);
          setResults([]);
          return;
        }
      }

      const responseWarnings = Array.isArray(res.data?.warnings)
        ? res.data.warnings.filter((w: unknown) => typeof w === "string")
        : [];
      setProviderWarnings(responseWarnings as string[]);

      const responseProvider = normalizeProviderKey(res.data?.provider_key || pk);
      const items = (res.data?.items || []).map((i: any) => ({
        ...i,
        provider_key: responseProvider,
        thumbnail: i.thumbnail_url || i.thumbnail || "",
        image_urls: i.image_urls || [],
        category_name: i.category_name || i.raw?.categoryName || undefined,
        ship_from_country: i.ship_from_country || undefined,
      }));

      if (import.meta.env.DEV && res.data?.debug) {
        console.log("dropship-search debug", { provider: responseProvider, debug: res.data.debug });
      }
      if (import.meta.env.DEV && res.data?.modern_diagnostics) {
        console.log("[ModernDropship Diagnostics]", res.data.modern_diagnostics);
      }

      setResults(items);
    } catch (err: any) {
      console.warn("Search error (non-fatal):", err);
      setProviderWarnings([`Provider temporarily unavailable. Try again.`]);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [providerKey, isConnected, selectedShopSurfaceId]);

  useEffect(() => {
    if (connectionsLoading || hasAttemptedProviderLoad) return;

    const connected = connectedProviders();
    const defaultProvider = connected.includes("cj")
      ? "cj"
      : connected.includes("moderndropship")
        ? "moderndropship"
        : "estores";

    setProviderKey(defaultProvider);
    void doSearch("", defaultProvider);
  }, [connectionsLoading, connectedProviders, doSearch, hasAttemptedProviderLoad]);

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

  const handleSourceClick = async (key: string) => {
    if (key === "dsers") return;

    const normalizedKey = normalizeProviderKey(key);
    if (normalizedKey !== "estores" && !isConnected(normalizedKey)) {
      toast.info(`Connect ${normalizedKey === "cj" ? "CJ Dropshipping" : "ModernDropship"} in the Manufacturers tab first.`);
      setActiveTab("manufacturers");
      return;
    }

    setProviderKey(normalizedKey);
    await doSearch(query, normalizedKey);
  };

  if (selectedProduct) {
    return (
      <ProductDetailView
        product={selectedProduct}
        providerKey={selectedProduct.provider_key || providerKey}
        shopSurfaceId={selectedShopSurfaceId}
        formatPrice={formatPrice}
        onBack={() => setSelectedProduct(null)}
        shopSurfaces={shopSurfaces}
        onShopSurfaceChange={setSelectedShopSurfaceId}
      />
    );
  }

  const hasAnyProvider = connectedProviders().filter((p) => p !== "estores").length > 0;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* AI Mode Popup */}
      {showPopup && (
        <AiModePopup
          onClose={dismissPopup}
          onTryAiMode={() => {
            dismissPopup();
            setActiveTab("ai-mode");
          }}
        />
      )}

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
        {(activeTab === "products" || activeTab === "worldwide") && (
          <div className="px-6 pb-4">
            <form onSubmit={handleSearch} className="relative max-w-4xl mx-auto rounded-xl border-2 border-accent/40 bg-card overflow-hidden">
              <div className="px-4 pt-3 pb-1">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, suppliers, or niches..."
                  className="w-full text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between px-4 pb-3">
                <button type="button" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Search className="w-3.5 h-3.5" /> Image Search
                </button>
                <Button type="submit" size="sm" disabled={searching} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-5 gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {searching ? "Searching…" : "Search"}
                </Button>
              </div>
            </form>

            {/* Source selector row */}
            <div className="flex items-center justify-center gap-2 mt-3">
              {ALL_SOURCES.map((s) => {
                const connected = isConnected(s.key);
                const isComingSoon = s.key === "dsers";
                const active = providerKey === s.key;

                return (
                  <button
                    key={s.key}
                    disabled={isComingSoon}
                    onClick={() => handleSourceClick(s.key)}
                    className={`text-xs px-3 py-1.5 rounded-md border transition-colors flex items-center gap-1.5 ${
                      active
                        ? "border-accent bg-accent/10 text-accent font-medium"
                        : connected
                          ? "border-border text-muted-foreground hover:border-accent/40 hover:text-foreground"
                          : isComingSoon
                            ? "border-border/40 text-muted-foreground/40 cursor-not-allowed"
                            : "border-border/60 text-muted-foreground/60 hover:border-accent/40"
                    }`}
                  >
                    {!connected && !isComingSoon && s.key !== "estores" && <Plug className="w-3 h-3" />}
                    {s.label}
                    {isComingSoon && " (soon)"}
                    {!connected && !isComingSoon && s.key !== "estores" && (
                      <span className="text-[10px] text-muted-foreground/50">• not connected</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "ai-mode" && (
          <div className="max-w-2xl mx-auto py-12 px-6 space-y-6">
            <div className="text-center space-y-2">
              <Sparkles className="w-10 h-10 text-accent mx-auto" />
              <h2 className="text-lg font-bold text-foreground">AI Sourcing Mode</h2>
              <p className="text-sm text-muted-foreground">
                {results.length > 0
                  ? `${results.length} ${providerKey === "cj" ? "CJ" : providerKey === "moderndropship" ? "ModernDropship" : "YANGU"} products loaded. Ask AI to recommend the best ones.`
                  : "Describe what you're looking for and AI will help you find the best products."}
              </p>
            </div>

            {/* Product context summary */}
            {results.length > 0 && (
              <div className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Dataset</p>
                <div className="flex flex-wrap gap-3 text-xs text-foreground">
                  <span>Provider: <strong>{providerKey === "cj" ? "CJ" : providerKey === "moderndropship" ? "ModernDropship" : "YANGU Estores"}</strong></span>
                  <span>Products: <strong>{results.length}</strong></span>
                  {(() => {
                    const cats = new Set(results.map((r) => r.category_name).filter(Boolean));
                    return cats.size > 0 ? <span>Categories: <strong>{cats.size}</strong></span> : null;
                  })()}
                  {(() => {
                    const countries = new Set(results.map((r) => r.ship_from_country).filter(Boolean));
                    return countries.size > 0 ? <span>Ship from: <strong>{Array.from(countries).join(", ")}</strong></span> : null;
                  })()}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {results.slice(0, 5).map((r) => (
                    <span key={r.external_product_id} className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground truncate max-w-[180px]">
                      {r.title}
                    </span>
                  ))}
                  {results.length > 5 && <span className="text-[10px] text-muted-foreground">+{results.length - 5} more</span>}
                </div>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); setActiveTab("products"); doSearch(query); }} className="space-y-3">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={results.length > 0
                  ? "e.g. Which of these products have the best margin? Show me items under $5 from China..."
                  : "e.g. Find trending wireless earbuds under $15 with fast shipping from China..."}
                className="w-full h-28 p-4 rounded-xl border-2 border-accent/30 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent resize-none"
              />
              <div className="flex flex-wrap gap-2">
                {(results.length > 0
                  ? ["Show best margin products", "Items under $5", "Fast shipping options", "Top categories"]
                  : ["Trending on TikTok", "High margin products", "US warehouse items", "Best sellers under $10"]
                ).map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => { setQuery(chip); setActiveTab("products"); doSearch(chip); }}
                    className="px-3 py-1.5 rounded-xl border border-border/60 bg-card/60 text-xs text-muted-foreground hover:border-accent/40 hover:text-foreground transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
                <Sparkles className="w-4 h-4" /> Search with AI
              </Button>
            </form>
          </div>
        )}
        {activeTab === "products" && (
          <ProductsTab
            results={results}
            searching={searching}
            query={query}
            formatPrice={formatPrice}
            onProductClick={setSelectedProduct}
            onSearch={(q) => { setQuery(q); void doSearch(q, providerKey); }}
            hasConnectedProvider={hasAnyProvider}
            onGoToManufacturers={() => setActiveTab("manufacturers")}
            providerWarnings={providerWarnings}
            selectedProviderKey={providerKey}
            hasAttemptedProviderLoad={hasAttemptedProviderLoad}
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
