import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Plus, Trash2, ImageIcon } from "lucide-react";
import { ItemCtaSelector, getDefaultCtaForSurface } from "@/components/builder/editors/ItemCtaSelector";
import type { ProductCardData } from "@/lib/builder/selectionTypes";

interface ProductCardEditorModalProps {
  open: boolean;
  product: ProductCardData | null;
  onClose: () => void;
  onSave: (product: ProductCardData) => void;
  surfaceType?: string;
}

interface ProductDeleteConfirmModalProps {
  open: boolean;
  product: ProductCardData | null;
  onClose: () => void;
  onConfirm: (product: ProductCardData) => void;
}

export function ProductCardEditorModal({ open, product, onClose, onSave, surfaceType }: ProductCardEditorModalProps) {
  const [draft, setDraft] = useState<ProductCardData | null>(product);
  const [images, setImages] = useState<string[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [ctaValue, setCtaValue] = useState("add_to_cart");
  const [buttonText, setButtonText] = useState("+ Add");
  const [actionType, setActionType] = useState("checkout");
  const [actionUrl, setActionUrl] = useState("");
  const [stock, setStock] = useState("");

  useEffect(() => {
    setDraft(product);
    if (product?.imageSrc) {
      setImages([product.imageSrc]);
    } else {
      setImages([]);
    }
    setActiveImageIdx(0);

    // Set surface-aware defaults
    const defaults = getDefaultCtaForSurface(surfaceType);
    setCtaValue(defaults.ctaAction);
    setButtonText(defaults.buttonText);
    setActionType(defaults.actionType);
    setActionUrl("");
    setStock("");
  }, [product, surfaceType]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !draft) return null;

  const handleAddImage = () => {
    const url = prompt("Image URL:");
    if (url?.trim()) {
      setImages((prev) => [...prev, url.trim()]);
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (activeImageIdx >= images.length - 1) setActiveImageIdx(Math.max(0, images.length - 2));
  };

  const handleSave = () => {
    if (!draft) return;
    onSave({
      ...draft,
      imageSrc: images[0] || draft.imageSrc,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Edit Product</h2>
          <p className="mt-1 text-sm text-muted-foreground">Update product details, images, and button settings.</p>
        </div>

        <div className="space-y-4 px-6 py-5">
          {/* Image Gallery */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Images</Label>
            {images.length > 0 ? (
              <div className="relative overflow-hidden rounded-xl border border-border bg-muted/20">
                <img
                  src={images[activeImageIdx] || images[0]}
                  alt={draft.name || "Product"}
                  className="h-40 w-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-black/50 text-white hover:bg-black/70"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setActiveImageIdx((prev) => (prev + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-black/50 text-white hover:bg-black/70"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {images.map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-2 h-2 rounded-full ${idx === activeImageIdx ? "bg-white" : "bg-white/40"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
                <button
                  onClick={() => handleRemoveImage(activeImageIdx)}
                  className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 text-white hover:bg-destructive"
                  title="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="h-28 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                <ImageIcon className="h-6 w-6 mr-2" /> No images
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleAddImage} className="gap-1">
              <Plus className="h-3.5 w-3.5" /> Add Image
            </Button>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Item Name</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((prev) => prev ? { ...prev, name: e.target.value } : prev)}
              placeholder="Product name"
            />
          </div>

          {/* Description + Price */}
          <div className="grid gap-4 md:grid-cols-[1fr_140px]">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                placeholder="Short product description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Price</Label>
              <Input
                value={draft.price}
                onChange={(e) => setDraft((prev) => prev ? { ...prev, price: e.target.value } : prev)}
                placeholder="Price"
              />
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Stock</Label>
                <Input
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Unlimited"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Button Config Section */}
          <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
            <h4 className="text-sm font-semibold text-foreground">Button Config</h4>
            <ItemCtaSelector
              value={ctaValue}
              onChange={setCtaValue}
              buttonText={buttonText}
              onButtonTextChange={setButtonText}
              actionType={actionType}
              onActionTypeChange={setActionType}
              actionUrl={actionUrl}
              onActionUrlChange={setActionUrl}
              surfaceType={surfaceType}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!draft.name.trim()}>Save Item</Button>
        </div>
      </div>
    </div>
  );
}

export function ProductDeleteConfirmModal({ open, product, onClose, onConfirm }: ProductDeleteConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Delete product</h2>
          <p className="mt-1 text-sm text-muted-foreground">This removes only the selected product card.</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-foreground">
            Delete <span className="font-semibold">{product.name || "this product"}</span> from the canvas?
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => onConfirm(product)}>Delete</Button>
        </div>
      </div>
    </div>
  );
}
