import { useState, useCallback } from "react";
import { Search, Sparkles, Package, Users, FileBox, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProductCard from "@/components/eshop/ProductCard";
import ProductDrawer from "@/components/eshop/ProductDrawer";
import ImportTable from "@/components/eshop/ImportTable";
import SuppliersTab from "@/components/eshop/SuppliersTab";
import AdaAssistantPanel from "@/components/eshop/AdaAssistantPanel";

interface SearchItem {
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

// Placeholder shop surface id — in production resolve from user's store
const SHOP_SURFACE_ID = "";

export default function EshopConnectPage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SearchItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [providerKey, setProviderKey] = useState("cj");

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
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

  const openProductDetail = (item: SearchItem) => {
    setSelectedProduct(item);
    setDrawerOpen(true);
  };

  const handleSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setActiveTab("products");
    doSearch(suggestion);
  };

  const formatPrice = (cents: number | undefined, currency: string | undefined) => {
    if (cents == null || !currency) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(cents / 100);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-accent" />
                Eshop Connect
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Source products and suppliers for your store
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-accent/30 text-accent hover:bg-accent/10"
              onClick={() => toast.info("Connect your store to start importing products.")}
            >
              Connect Store
            </Button>
          </div>

          {/* AI Sourcing Bar */}
          <form onSubmit={handleSearch} className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, suppliers, or niches..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <select
              value={providerKey}
              onChange={(e) => setProviderKey(e.target.value)}
              className="px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground"
            >
              <option value="cj">CJ Dropshipping</option>
              <option value="moderndropship">ModernDropship</option>
            </select>
            <Button type="submit" size="sm" disabled={searching} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {searching ? "Searching…" : "Search"}
            </Button>
          </form>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-3 border-b border-border/40">
            <TabsList className="bg-transparent h-auto p-0 gap-4">
              <TabsTrigger value="products" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none px-1 pb-2 text-sm font-medium text-muted-foreground">
                <Package className="w-3.5 h-3.5 mr-1.5" /> Products
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none px-1 pb-2 text-sm font-medium text-muted-foreground">
                <Users className="w-3.5 h-3.5 mr-1.5" /> Suppliers
              </TabsTrigger>
              <TabsTrigger value="imports" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none px-1 pb-2 text-sm font-medium text-muted-foreground">
                <FileBox className="w-3.5 h-3.5 mr-1.5" /> My Imports
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Products Tab */}
          <TabsContent value="products" className="flex-1 p-6 overflow-y-auto m-0">
            {searching ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((item) => (
                  <ProductCard
                    key={item.external_product_id}
                    item={item}
                    formatPrice={formatPrice}
                    onClick={() => openProductDetail(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Search for products to get started</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try "wireless earbuds" or "smart watch"</p>
              </div>
            )}
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="flex-1 p-6 overflow-y-auto m-0">
            <SuppliersTab />
          </TabsContent>

          {/* My Imports Tab */}
          <TabsContent value="imports" className="flex-1 p-6 overflow-y-auto m-0">
            <ImportTable formatPrice={formatPrice} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Ada Assistant Panel */}
      {assistantOpen && (
        <div className="w-[300px] border-l border-border/60 flex flex-col bg-card shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <span className="text-sm font-medium text-foreground">Ada AI Assistant</span>
            <button onClick={() => setAssistantOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <AdaAssistantPanel onSuggestionClick={handleSuggestion} />
        </div>
      )}

      {/* Product Detail Drawer */}
      <ProductDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        product={selectedProduct}
        providerKey={selectedProduct?.provider_key || providerKey}
        shopSurfaceId={SHOP_SURFACE_ID}
        formatPrice={formatPrice}
      />
    </div>
  );
}
