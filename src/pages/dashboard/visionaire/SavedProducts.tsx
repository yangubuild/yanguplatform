import { useState, useMemo } from "react";
import { Search, Grid3X3, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VisionaireGrid } from "@/components/visionaire/VisionaireGrid";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { useVisionaireSaves } from "@/hooks/useVisionaireItems";

const TYPE_FILTERS = ["all", "ebook", "course", "template", "mockup", "deal", "tool"] as const;

export default function SavedProducts() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { data: saves, isLoading } = useVisionaireSaves();

  const items = useMemo(() => {
    if (!saves) return [];
    let list = saves.map((s) => s.visionaire_items).filter(Boolean);
    if (typeFilter !== "all") list = list.filter((i: any) => i.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i: any) => i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    return list;
  }, [saves, typeFilter, search]);

  return (
    <VisionairePageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Saved Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Your bookmarked items across all categories</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search saved..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {TYPE_FILTERS.map((t) => (
              <Badge
                key={t}
                variant={typeFilter === t ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => setTypeFilter(t)}
              >
                {t}
              </Badge>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("grid")}>
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <VisionaireGrid items={items} isLoading={isLoading} />
      </div>
    </VisionairePageContainer>
  );
}
