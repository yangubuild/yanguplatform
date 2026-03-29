import { useState } from "react";
import { X, Search, Grid3X3, List, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSocialLibrary } from "@/hooks/social/useSocialLibrary";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (urls: string[]) => void;
  multiple?: boolean;
}

export function LibraryModalPicker({ open, onOpenChange, onSelect, multiple = false }: Props) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { items, isLoading } = useSocialLibrary({ search });

  const imageItems = items.filter((i) => i.file_url);

  const toggleSelect = (url: string) => {
    if (multiple) {
      const next = new Set(selected);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      setSelected(next);
    } else {
      onSelect([url]);
      onOpenChange(false);
    }
  };

  const handleConfirm = () => {
    onSelect(Array.from(selected));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Library</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search library photos..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground"}`}>
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground"}`}>
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : imageItems.length > 0 ? (
            <div className={viewMode === "grid" ? "grid grid-cols-3 sm:grid-cols-4 gap-2" : "space-y-2"}>
              {imageItems.map((item) => {
                const isSelected = selected.has(item.file_url!);
                return viewMode === "grid" ? (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.file_url!)}
                    className={`relative rounded-lg overflow-hidden aspect-square cursor-pointer border-2 transition-colors ${
                      isSelected ? "border-accent" : "border-transparent hover:border-border"
                    }`}
                  >
                    <img src={item.file_url!} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.file_url!)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-colors ${
                      isSelected ? "border-accent bg-accent/5" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <img src={item.file_url!} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.source_type}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-12">
              {search ? "No matching items" : "No images in your library yet"}
            </p>
          )}
        </div>

        {multiple && selected.size > 0 && (
          <div className="flex justify-end pt-2">
            <Button onClick={handleConfirm}>
              Use {selected.size} image{selected.size > 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
