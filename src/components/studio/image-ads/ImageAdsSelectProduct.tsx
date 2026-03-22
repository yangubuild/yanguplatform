import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Check, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddProductModal } from "./AddProductModal";

const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Dokotoo Womens Tops Fashion ...",
    assets: 10,
    thumbs: [
      "/studio/demo-product-1.jpg",
      "/studio/demo-product-2.jpg",
      "/studio/demo-product-3.jpg",
      "/studio/demo-product-4.jpg",
      "/studio/demo-product-5.jpg",
      "/studio/demo-product-6.jpg",
    ],
  },
  {
    id: "2",
    name: "ada ai",
    assets: 2,
    thumbs: [
      "/studio/img-ad-1.webp",
      "/studio/img-ad-2.webp",
      "/studio/img-ad-3.webp",
      "/studio/img-ad-4.webp",
    ],
  },
];

interface Props {
  onCancel: () => void;
  onSelect: (id: string) => void;
  onManualSetup?: () => void;
  onSyncBusiness?: () => void;
  onBulkUpload?: () => void;
}

export function ImageAdsSelectProduct({ onCancel, onSelect, onManualSetup, onSyncBusiness, onBulkUpload }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const filtered = MOCK_PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="absolute inset-0 z-30 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <h2 className="text-xl font-bold text-foreground">Select a product</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="pl-9 h-9 w-48 rounded-lg bg-card border-border/60 text-sm outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button
            variant="accent"
            size="sm"
            className="rounded-lg text-xs font-semibold gap-1.5"
            onClick={() => setAddModalOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            New products
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-8 pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => setSelected(product.id)}
              className={`group relative rounded-xl border-2 text-left transition-colors ${
                selected === product.id
                  ? "border-accent/60"
                  : "border-transparent hover:border-border/40"
              }`}
            >
              {/* Checkbox */}
              <div className={`absolute top-3 left-3 z-10 h-4 w-4 rounded border border-border/60 flex items-center justify-center ${
                selected === product.id ? "bg-accent border-accent" : "bg-card/60"
              }`}>
                {selected === product.id && <Check className="h-2.5 w-2.5 text-foreground" />}
              </div>

              {/* Top-right actions */}
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-7 w-7 rounded-md bg-card/80 backdrop-blur flex items-center justify-center">
                  <Plus className="h-3.5 w-3.5 text-foreground" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="h-7 w-7 rounded-md bg-card/80 backdrop-blur flex items-center justify-center cursor-pointer">
                      <MoreVertical className="h-3.5 w-3.5 text-foreground" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem className="gap-2">
                      <Pencil className="h-4 w-4" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-destructive">
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Thumbnail collage */}
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted/30">
                {product.thumbs.length >= 6 ? (
                  <div className="grid grid-cols-3 grid-rows-2 h-full w-full gap-0.5">
                    {product.thumbs.slice(0, 6).map((t, i) => (
                      <img key={i} src={t} alt="" className="w-full h-full object-cover" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 h-full w-full gap-0.5">
                    {product.thumbs.slice(0, 4).map((t, i) => (
                      <img key={i} src={t} alt="" className="w-full h-full object-cover" />
                    ))}
                  </div>
                )}
              </div>

              {/* Label */}
              <p className="text-sm font-medium text-foreground truncate mt-2 px-1">{product.name}</p>
              <p className="text-xs text-muted-foreground px-1 pb-2">{product.assets} assets</p>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 flex items-center justify-end gap-3 px-8 py-4 border-t border-border/40 bg-background">
        <Button variant="outline" onClick={onCancel} className="rounded-lg">
          Cancel
        </Button>
        <Button
          variant="accent"
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
          className="rounded-lg"
        >
          Use this product
        </Button>
      </div>

      {/* Add Product Modal */}
      <AddProductModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onEnterManually={onManualSetup} onSyncBusiness={onSyncBusiness} onBulkUpload={onBulkUpload} />
    </div>
  );
}
