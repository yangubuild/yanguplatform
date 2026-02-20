import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store, Check, Package } from "lucide-react";

// Mock businesses — will be replaced with real data from My Business module
const MOCK_BUSINESSES = [
  { id: "b1", name: "My Fashion Store", productCount: 12 },
  { id: "b2", name: "Artisan Crafts Shop", productCount: 8 },
];

const MOCK_BUSINESS_PRODUCTS: Record<string, { id: string; name: string; thumb: string }[]> = {
  b1: [
    { id: "bp1", name: "Ankara Dress", thumb: "/studio/demo-product-1.jpg" },
    { id: "bp2", name: "Kitenge Shirt", thumb: "/studio/demo-product-2.jpg" },
    { id: "bp3", name: "Handmade Bracelet", thumb: "/studio/demo-product-3.jpg" },
    { id: "bp4", name: "Leather Bag", thumb: "/studio/demo-product-4.jpg" },
  ],
  b2: [
    { id: "bp5", name: "Wood Sculpture", thumb: "/studio/demo-product-5.jpg" },
    { id: "bp6", name: "Textile Wall Art", thumb: "/studio/demo-product-6.jpg" },
  ],
};

interface Props {
  onBack: () => void;
  onImport: (productIds: string[]) => void;
}

export function BusinessProductSelector({ onBack, onImport }: Props) {
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const products = selectedBusiness ? MOCK_BUSINESS_PRODUCTS[selectedBusiness] ?? [] : [];

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBack = () => {
    if (selectedBusiness) {
      setSelectedBusiness(null);
      setSelectedProducts(new Set());
    } else {
      onBack();
    }
  };

  return (
    <div className="absolute inset-0 z-30 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold text-foreground">
            {selectedBusiness ? "Select products" : "Select a business"}
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-24">
        {!selectedBusiness ? (
          /* Step 1: Business Selection */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {MOCK_BUSINESSES.map((biz) => (
              <button
                key={biz.id}
                onClick={() => setSelectedBusiness(biz.id)}
                className="flex items-center gap-4 rounded-xl border border-border/40 px-5 py-5 text-left transition-colors hover:border-border bg-card/60 hover:bg-muted/30"
              >
                <div className="h-10 w-10 rounded-lg bg-muted/40 flex items-center justify-center">
                  <Store className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{biz.name}</p>
                  <p className="text-xs text-muted-foreground">{biz.productCount} products</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Step 2: Product Selection */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {products.map((product) => {
              const isSelected = selectedProducts.has(product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={`group relative rounded-xl border-2 text-left transition-colors ${
                    isSelected ? "border-accent/60" : "border-transparent hover:border-border/40"
                  }`}
                >
                  {/* Checkbox */}
                  <div className={`absolute top-3 left-3 z-10 h-4 w-4 rounded border border-border/60 flex items-center justify-center ${
                    isSelected ? "bg-accent border-accent" : "bg-card/60"
                  }`}>
                    {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>

                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted/30">
                    <img src={product.thumb} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-sm font-medium text-foreground truncate mt-2 px-1">{product.name}</p>
                </button>
              );
            })}

            {products.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <Package className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">No products found</p>
                <p className="text-xs text-muted-foreground mt-1">This business doesn't have any products yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {selectedBusiness && (
        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-8 py-4 border-t border-border/40 bg-background">
          <Button variant="outline" onClick={handleBack} className="rounded-lg">
            Cancel
          </Button>
          <Button
            variant="accent"
            disabled={selectedProducts.size === 0}
            onClick={() => onImport(Array.from(selectedProducts))}
            className="rounded-lg"
          >
            Use selected products
          </Button>
        </div>
      )}
    </div>
  );
}
