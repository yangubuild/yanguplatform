import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Check } from "lucide-react";

const MOCK_PRODUCTS = [
  { id: "1", name: "ada ai", assets: 2, thumb: null },
  { id: "2", name: "Sample Product", assets: 5, thumb: null },
  { id: "3", name: "Demo Brand", assets: 3, thumb: null },
];

interface Props {
  onCancel: () => void;
  onSelect: (id: string) => void;
}

export function ImageAdsSelectProduct({ onCancel, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = MOCK_PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <h2 className="text-xl font-bold text-foreground">Select a product</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="pl-9 h-9 w-56 rounded-lg bg-card border-border/60 text-sm"
            />
          </div>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg text-xs font-semibold gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New products
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-8 pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => setSelected(product.id)}
              className={`relative rounded-xl border-2 p-4 text-left transition-colors ${
                selected === product.id
                  ? "border-accent bg-accent/10"
                  : "border-border/40 bg-card hover:border-border"
              }`}
            >
              {selected === product.id && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-accent flex items-center justify-center">
                  <Check className="h-3 w-3 text-accent-foreground" />
                </div>
              )}
              <div className="w-full aspect-square rounded-lg bg-muted mb-3 flex items-center justify-center text-muted-foreground text-2xl font-bold">
                {product.name.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.assets} assets</p>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end gap-3 px-8 py-4 border-t border-border/40 bg-background">
        <Button variant="outline" onClick={onCancel} className="rounded-lg">
          Cancel
        </Button>
        <Button
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
          className="rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Use this product
        </Button>
      </div>
    </div>
  );
}
