import { VisionaireItemCard } from "./VisionaireItemCard";
import { useSaveItem, useUnsaveItem, useVisionaireSaves } from "@/hooks/useVisionaireItems";
import { toast } from "sonner";

interface VisionaireGridProps {
  items: any[];
  isLoading?: boolean;
}

export function VisionaireGrid({ items, isLoading }: VisionaireGridProps) {
  const { data: saves } = useVisionaireSaves();
  const saveItem = useSaveItem();
  const unsaveItem = useUnsaveItem();

  const savedIds = new Set(saves?.map((s) => s.item_id) || []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card animate-pulse">
            <div className="aspect-[4/3] bg-muted" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">No items found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item) => (
        <VisionaireItemCard
          key={item.id}
          item={item}
          isSaved={savedIds.has(item.id)}
          onSave={() => {
            saveItem.mutate(item.id, {
              onSuccess: () => toast.success("Saved"),
              onError: () => toast.error("Failed to save"),
            });
          }}
          onUnsave={() => {
            unsaveItem.mutate(item.id, {
              onSuccess: () => toast.success("Removed from saved"),
              onError: () => toast.error("Failed to remove"),
            });
          }}
        />
      ))}
    </div>
  );
}
