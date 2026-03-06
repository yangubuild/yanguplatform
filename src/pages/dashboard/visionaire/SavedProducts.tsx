import { useMemo } from "react";
import { Bookmark } from "lucide-react";
import { VisionaireGrid } from "@/components/visionaire/VisionaireGrid";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { useVisionaireSaves } from "@/hooks/useVisionaireItems";

export default function SavedProducts() {
  const { data: saves, isLoading } = useVisionaireSaves();

  const items = useMemo(() => {
    if (!saves) return [];
    return saves.map((s) => s.visionaire_items).filter(Boolean);
  }, [saves]);

  return (
    <VisionairePageContainer>
      <div className="space-y-8 pb-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 pt-4 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/50 text-xs text-muted-foreground">
            <Bookmark className="h-3.5 w-3.5" /> Your favorites
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Saved Products
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your collection of bookmarked digital products
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <h3 className="font-semibold text-foreground text-base">No saved products yet</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Products you bookmark will appear here for easy access.
            </p>
          </div>
        ) : (
          <VisionaireGrid items={items} isLoading={false} />
        )}
      </div>
    </VisionairePageContainer>
  );
}
