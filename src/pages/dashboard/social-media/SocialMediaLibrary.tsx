import { useState, useRef } from "react";
import { BookOpen, Upload, Search as SearchIcon, Image, Sparkles, Grid3X3, List, Loader2, Trash2, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocialLibrary } from "@/hooks/social/useSocialLibrary";
import { StockImageSearchModal } from "@/components/social-media/library/StockImageSearchModal";
import { AIGenerateImageModal } from "@/components/social-media/library/AIGenerateImageModal";
import type { LibrarySourceType } from "@/services/socialMedia/libraryService";

export default function SocialMediaLibrary() {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<LibrarySourceType | undefined>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [stockOpen, setStockOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { items, isLoading, counts, uploadLimit, uploadFile, saveUrl, deleteItem, isUploading, isSaving } = useSocialLibrary({
    search: search || undefined,
    source_type: sourceFilter,
  });

  const imageItems = items.filter((i) => i.file_url);
  const uploadCount = counts.upload;
  const atLimit = uploadCount >= uploadLimit;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      try {
        await uploadFile(file);
      } catch {
        // handled by hook
      }
    }
    e.target.value = "";
  };

  const handleStockSave = async (url: string, title: string) => {
    await saveUrl({ url, title, sourceType: "stock" });
  };

  const handleAiSave = async (url: string, title: string) => {
    await saveUrl({ url, title, sourceType: "ai_generated" });
  };

  const filters: { label: string; value: LibrarySourceType | undefined }[] = [
    { label: "All", value: undefined },
    { label: "Uploads", value: "upload" },
    { label: "Stock", value: "stock" },
    { label: "AI Generated", value: "ai_generated" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Library</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {counts.total} item{counts.total !== 1 ? "s" : ""} · {uploadCount}/{uploadLimit} uploads used
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setStockOpen(true)} className="gap-1.5 text-xs">
            <SearchIcon className="h-3.5 w-3.5" />
            Stock
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAiOpen(true)} className="gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Generate
          </Button>
          <Button
            size="sm"
            onClick={() => !atLimit && fileRef.current?.click()}
            disabled={atLimit || isUploading}
            className="gap-1.5 text-xs"
          >
            {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload
          </Button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Upload limit warning */}
      {atLimit && (
        <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">
            Upload limit reached ({uploadLimit} images). Upgrade your plan for more storage.
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search library..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.label}
              onClick={() => setSourceFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                sourceFilter === f.value ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-0.5">
          <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground"}`}>
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground"}`}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : imageItems.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {imageItems.map((item) => (
              <div key={item.id} className="group relative rounded-xl overflow-hidden aspect-square bg-muted border border-border">
                <img src={item.file_url!} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1.5 rounded-lg bg-black/50 hover:bg-red-600 text-white transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white truncate">{item.title}</p>
                  <p className="text-[9px] text-white/60 capitalize">{item.source_type}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {imageItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
                <img src={item.file_url!} alt={item.title} className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item.source_type?.replace("_", " ")}</p>
                </div>
                <button onClick={() => deleteItem(item.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <Image className="w-8 h-8 text-accent/60" />
          </div>
          <h2 className="text-sm font-semibold text-foreground mb-1">
            {search ? "No matching media" : "Your library is empty"}
          </h2>
          <p className="text-xs text-muted-foreground text-center max-w-xs mb-4">
            {search ? "Try a different search" : "Upload images, save stock photos, or generate AI images to build your library."}
          </p>
          {!search && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => !atLimit && fileRef.current?.click()} disabled={atLimit}>
                <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
              </Button>
              <Button size="sm" variant="outline" onClick={() => setStockOpen(true)}>
                <SearchIcon className="h-3.5 w-3.5 mr-1.5" /> Stock
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAiOpen(true)}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate
              </Button>
            </div>
          )}
        </div>
      )}

      {imageItems.length > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-6">
          {imageItems.length === items.length ? "No more images to load" : ""}
        </p>
      )}

      {/* Modals */}
      <StockImageSearchModal open={stockOpen} onOpenChange={setStockOpen} onSave={handleStockSave} />
      <AIGenerateImageModal open={aiOpen} onOpenChange={setAiOpen} onSave={handleAiSave} />
    </div>
  );
}
