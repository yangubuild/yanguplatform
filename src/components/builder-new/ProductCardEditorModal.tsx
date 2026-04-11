import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ProductCardData } from "@/lib/builder/selectionTypes";

interface ProductCardEditorModalProps {
  open: boolean;
  product: ProductCardData | null;
  onClose: () => void;
  onSave: (product: ProductCardData) => void;
}

interface ProductDeleteConfirmModalProps {
  open: boolean;
  product: ProductCardData | null;
  onClose: () => void;
  onConfirm: (product: ProductCardData) => void;
}

export function ProductCardEditorModal({ open, product, onClose, onSave }: ProductCardEditorModalProps) {
  const [draft, setDraft] = useState<ProductCardData | null>(product);

  useEffect(() => {
    setDraft(product);
  }, [product]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !draft) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl border border-border bg-background shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Edit product</h2>
          <p className="mt-1 text-sm text-muted-foreground">Update this product card without opening the Magic Editor.</p>
        </div>

        <div className="space-y-4 px-6 py-5">
          {draft.imageSrc ? (
            <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
              <img src={draft.imageSrc} alt={draft.name || "Product"} className="h-40 w-full object-cover" />
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Name</label>
            <Input
              value={draft.name}
              onChange={(event) => setDraft((prev) => prev ? { ...prev, name: event.target.value } : prev)}
              placeholder="Product name"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={draft.description}
                onChange={(event) => setDraft((prev) => prev ? { ...prev, description: event.target.value } : prev)}
                placeholder="Short product description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Price</label>
              <Input
                value={draft.price}
                onChange={(event) => setDraft((prev) => prev ? { ...prev, price: event.target.value } : prev)}
                placeholder="Price"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => draft && onSave(draft)} disabled={!draft.name.trim()}>Save product</Button>
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
      <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl" onClick={(event) => event.stopPropagation()}>
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