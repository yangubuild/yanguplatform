import { useState, useMemo } from "react";
import { Search, Tag, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSaveItem, useUnsaveItem, useVisionaireSaves, useVisionaireItems } from "@/hooks/useVisionaireItems";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { toast } from "sonner";

export default function SpecialDeals() {
  const [search, setSearch] = useState("");
  const { data: items, isLoading } = useVisionaireItems("special_deals");
  const { data: saves } = useVisionaireSaves();
  const saveItem = useSaveItem();
  const unsaveItem = useUnsaveItem();
  const savedIds = new Set(saves?.map((s) => s.item_id) || []);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.title.toLowerCase().includes(q));
  }, [items, search]);

  if (isLoading) {
    return <div className="space-y-6"><div className="h-8 bg-muted rounded w-48 animate-pulse" /></div>;
  }

  return (
    <VisionairePageContainer>
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Special Deals</h1>
        <p className="text-sm text-muted-foreground mt-1">Limited-time offers on premium digital product bundles</p>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search deals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered.map((deal) => {
          const c = deal.content as any;
          const isSaved = savedIds.has(deal.id);
          return (
            <div key={deal.id} className="rounded-xl border border-border bg-card overflow-hidden group hover:shadow-lg transition-all">
              {deal.thumbnail_url && (
                <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                  <img src={deal.thumbnail_url} alt={deal.title} className="w-full h-full object-cover" loading="lazy" />
                  {c?.discount && (
                    <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">{c.discount}% OFF</Badge>
                  )}
                </div>
              )}
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-sm text-foreground line-clamp-2">{deal.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{deal.description}</p>
                <div className="flex items-center gap-2">
                  {c?.originalPrice && <span className="text-xs text-muted-foreground line-through">${c.originalPrice}</span>}
                  {c?.salePrice && <span className="text-lg font-bold text-foreground">${c.salePrice}</span>}
                </div>
                {c?.expiresIn && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Expires in {c.expiresIn}</span>
                  </div>
                )}
                {c?.includes && (
                  <div className="flex flex-wrap gap-1">
                    {(c.includes as string[]).map((inc, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{inc}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <Button variant="accent" size="sm" className="flex-1 text-xs">
                    <Tag className="h-3 w-3 mr-1" /> Get Deal
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      if (isSaved) {
                        unsaveItem.mutate(deal.id, { onSuccess: () => toast.success("Removed"), onError: () => toast.error("Error") });
                      } else {
                        saveItem.mutate(deal.id, { onSuccess: () => toast.success("Saved"), onError: () => toast.error("Error") });
                      }
                    }}
                  >
                    {isSaved ? <BookmarkCheck className="h-4 w-4 text-accent" /> : <Bookmark className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
       </div>
      </div>
    </VisionairePageContainer>
  );
}
