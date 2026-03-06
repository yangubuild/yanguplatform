import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bookmark, BookmarkCheck, ExternalLink, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { useVisionaireItems, useVisionaireSaves, useSaveItem, useUnsaveItem } from "@/hooks/useVisionaireItems";
import { toast } from "sonner";

export default function VisionaireBundles() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: items, isLoading } = useVisionaireItems("bundles");
  const { data: saves } = useVisionaireSaves();
  const saveItem = useSaveItem();
  const unsaveItem = useUnsaveItem();
  const savedIds = new Set(saves?.map((s) => s.item_id) || []);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.tags as string[] | null)?.some((t) => t.toLowerCase().includes(q))
    );
  }, [items, search]);

  return (
    <VisionairePageContainer>
      <div className="space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/50 text-xs text-muted-foreground">
            <Package className="h-3.5 w-3.5" /> New Feature
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Get Instant Access to {filtered.length}+ Collections
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            No more hunting for individual products. Download comprehensive bundles of related content with one click.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bundles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card animate-pulse h-80" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No bundles found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((bundle) => {
              const content = bundle.content as any;
              const isSaved = savedIds.has(bundle.id);
              return (
                <div
                  key={bundle.id}
                  className="rounded-xl border border-border bg-card overflow-hidden group hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => navigate(`/dashboard/visionaire/bundle/${bundle.id}`)}
                >
                  {/* Cover */}
                  <div className="relative aspect-[4/3] bg-black overflow-hidden">
                    {bundle.thumbnail_url ? (
                      <img
                        src={bundle.thumbnail_url}
                        alt={bundle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Package className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Item count badge */}
                    {content?.item_count && (
                      <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm">
                        {content.item_count} items
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-foreground text-base leading-tight line-clamp-2">
                      {bundle.title}
                    </h3>
                    {content?.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{content.description}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 h-9 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/visionaire/bundle/${bundle.id}`);
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open Bundle
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSaved) {
                            unsaveItem.mutate(bundle.id, {
                              onSuccess: () => toast.success("Removed from saved"),
                              onError: () => toast.error("Failed"),
                            });
                          } else {
                            saveItem.mutate(bundle.id, {
                              onSuccess: () => toast.success("Saved"),
                              onError: () => toast.error("Failed"),
                            });
                          }
                        }}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </VisionairePageContainer>
  );
}
