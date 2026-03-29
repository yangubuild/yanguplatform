import { useState, useRef } from "react";
import { X, Upload, FolderOpen, Cloud, Sparkles, Loader2, Search, Grid3X3, List, Check, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSocialLibrary } from "@/hooks/social/useSocialLibrary";
import { toast } from "sonner";

interface Props {
  onSelect: (urls: string[]) => void;
  onClose: () => void;
}

type Tab = "upload" | "library" | "stock" | "generate";

export function MediaSourcePicker({ onSelect, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("upload");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Add Media</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3">
          {([
            { key: "upload" as Tab, icon: Upload, label: "Upload" },
            { key: "library" as Tab, icon: FolderOpen, label: "Library" },
            { key: "stock" as Tab, icon: Cloud, label: "Stock" },
            { key: "generate" as Tab, icon: Sparkles, label: "Generate" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                tab === t.key ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 min-h-[300px]">
          {tab === "upload" && <UploadTab onSelect={onSelect} />}
          {tab === "library" && <LibraryTab onSelect={onSelect} />}
          {tab === "stock" && <StockTab onSelect={onSelect} />}
          {tab === "generate" && <GenerateTab onSelect={onSelect} />}
        </div>
      </div>
    </div>
  );
}

function UploadTab({ onSelect }: { onSelect: (urls: string[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { uploadFile, counts, uploadLimit } = useSocialLibrary();
  const atLimit = counts.upload >= uploadLimit;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const urls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const item = await uploadFile(file);
        if (item.file_url) urls.push(item.file_url);
      }
      if (urls.length) onSelect(urls);
    } catch {
      // handled by hook
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onClick={() => !atLimit && fileRef.current?.click()}
      className={`flex flex-col items-center justify-center h-full min-h-[240px] border-2 border-dashed border-border rounded-xl transition-colors ${
        atLimit ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-accent/40"
      }`}
    >
      <input ref={fileRef} type="file" multiple accept="image/*,video/*" onChange={handleUpload} className="hidden" />
      {uploading ? (
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
      ) : (
        <>
          <Upload className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            {atLimit ? "Upload limit reached" : "Click to upload"}
          </p>
          <p className="text-xs text-muted-foreground">
            {atLimit ? `${uploadLimit} images max on free plan` : "PNG, JPG, GIF, MP4 up to 50MB"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-2">{counts.upload}/{uploadLimit} uploads used</p>
        </>
      )}
    </div>
  );
}

function LibraryTab({ onSelect }: { onSelect: (urls: string[]) => void }) {
  const [search, setSearch] = useState("");
  const { items, isLoading } = useSocialLibrary({ search: search || undefined });
  const imageItems = items.filter((i) => i.file_url);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search library..."
          className="w-full pl-8 pr-3 py-2 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        </div>
      ) : imageItems.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
          {imageItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect([item.file_url!])}
              className="relative rounded-lg overflow-hidden aspect-square cursor-pointer border border-transparent hover:border-accent transition-colors"
            >
              <img src={item.file_url!} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <FolderOpen className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">{search ? "No results" : "Library is empty"}</p>
        </div>
      )}
    </div>
  );
}

interface StockResult {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  author: string;
}

function StockTab({ onSelect }: { onSelect: (urls: string[]) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { saveUrl } = useSocialLibrary();

  const search = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setQuery(q);
    try {
      const { data, error } = await supabase.functions.invoke("builder-stock-search", {
        body: { query: q, mediaType: "image", page: 1 },
      });
      if (error) throw error;
      setResults(data?.results || []);
    } catch {
      toast.error("Stock search failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePick = async (r: StockResult) => {
    try {
      await saveUrl({ url: r.fullUrl, title: `Stock: ${query} - ${r.author}`, sourceType: "stock" });
      onSelect([r.fullUrl]);
    } catch {
      // handled
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search(query)}
          placeholder="Search stock photos..."
          className="w-full pl-8 pr-3 py-2 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent text-foreground placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {["business", "technology", "community", "marketplace"].map((s) => (
          <button key={s} onClick={() => search(s)} className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground">{s}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
          {results.map((r) => (
            <div key={r.id} onClick={() => handlePick(r)} className="relative group rounded-lg overflow-hidden aspect-square cursor-pointer">
              <img src={r.thumbUrl} alt={r.author} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <Download className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <Cloud className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Search for stock photos</p>
        </div>
      )}
      {results.length > 0 && <p className="text-[10px] text-muted-foreground text-center">Photos by Pexels</p>}
    </div>
  );
}

function GenerateTab({ onSelect }: { onSelect: (urls: string[]) => void }) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { saveUrl } = useSocialLibrary();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setPreviewUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("social-ai-generate-image", {
        body: { prompt: prompt.trim() },
      });
      if (error) throw error;
      if (data?.image_url) setPreviewUrl(data.image_url);
      else toast.error(data?.error || "Generation failed");
    } catch {
      toast.error("Image generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleUse = async () => {
    if (!previewUrl) return;
    try {
      await saveUrl({ url: previewUrl, title: `AI: ${prompt.slice(0, 50)}`, sourceType: "ai_generated" });
      onSelect([previewUrl]);
    } catch {
      // handled
    }
  };

  return (
    <div className="space-y-3">
      {previewUrl && (
        <div className="rounded-xl overflow-hidden aspect-square max-w-[240px] mx-auto border border-border">
          <img src={previewUrl} alt="Generated" className="w-full h-full object-cover" />
        </div>
      )}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the image you want to create..."
        rows={3}
        className="w-full text-xs bg-muted/50 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent text-foreground placeholder:text-muted-foreground resize-none"
      />
      <div className="flex justify-end gap-2">
        {previewUrl ? (
          <button onClick={handleUse} className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-lg hover:bg-accent/90">
            Use Image
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Generate
          </button>
        )}
      </div>
    </div>
  );
}
