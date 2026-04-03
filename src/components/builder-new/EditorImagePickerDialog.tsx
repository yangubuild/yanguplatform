import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Search, Sparkles, Image as ImageIcon, Loader2, ExternalLink, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StockResult {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  author: string;
  sourceUrl: string;
}

interface EditorImagePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

const SUGGESTIONS = ["food", "restaurant", "coffee", "bakery", "cocktail", "dessert"];

export function EditorImagePickerDialog({ open, onOpenChange, onSelect }: EditorImagePickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:max-w-2xl max-h-[80vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Replace Image</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="upload" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full h-9 shrink-0">
            <TabsTrigger value="upload" className="text-xs gap-1.5 flex-1">
              <Upload className="h-3.5 w-3.5" /> Upload
            </TabsTrigger>
            <TabsTrigger value="stock" className="text-xs gap-1.5 flex-1">
              <ImageIcon className="h-3.5 w-3.5" /> Stock
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs gap-1.5 flex-1">
              <Sparkles className="h-3.5 w-3.5" /> AI Generate
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-3 flex-1">
            <UploadPane onSelect={(url) => { onSelect(url); onOpenChange(false); }} />
          </TabsContent>
          <TabsContent value="stock" className="mt-3 flex-1 flex flex-col min-h-0">
            <StockPane onSelect={(url) => { onSelect(url); onOpenChange(false); }} />
          </TabsContent>
          <TabsContent value="ai" className="mt-3 flex-1">
            <AiPane onSelect={(url) => { onSelect(url); onOpenChange(false); }} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function UploadPane({ onSelect }: { onSelect: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please sign in"); return; }
      const path = `${session.user.id}/editor/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error } = await supabase.storage.from("builder-media").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("builder-media").getPublicUrl(path);
      onSelect(pub.publicUrl);
      toast.success("Uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onSelect]);

  return (
    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
      {uploading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
      ) : (
        <>
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <label className="cursor-pointer">
            <span className="text-sm font-medium text-accent hover:underline">Choose image or video</span>
            <input type="file" accept="image/*,video/mp4,video/webm" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </label>
          <p className="text-xs text-muted-foreground mt-2">PNG, JPG, WebP, MP4 · Max 20MB</p>
        </>
      )}
    </div>
  );
}

function StockPane({ onSelect }: { onSelect: (url: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setQuery(q);
    try {
      const { data, error } = await supabase.functions.invoke("builder-stock-search", { body: { query: q, mediaType: "image", page: 1 } });
      if (error) throw error;
      if (data?.ok) setResults(data.results || []);
      else toast.error("Search failed");
    } catch { toast.error("Could not search"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-3 min-h-0">
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search(query)} placeholder="Search stock photos..." className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent text-foreground placeholder:text-muted-foreground" />
      </div>
      <div className="flex gap-1.5 flex-wrap shrink-0">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => search(s)} className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors">{s}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {results.map((r) => (
              <button key={r.id} onClick={() => onSelect(r.fullUrl)} className="relative group rounded-lg overflow-hidden aspect-square bg-muted">
                <img src={r.thumbUrl} alt={r.author} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white truncate">{r.author}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-12">{query ? "No results" : "Search for photos above"}</p>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground text-center shrink-0 flex items-center justify-center gap-1">
        Photos from <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="underline">Pexels</a>
        <ExternalLink className="h-2.5 w-2.5" />
      </p>
    </div>
  );
}

function AiPane({ onSelect }: { onSelect: (url: string) => void }) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setPreview(null);
    try {
      const res = await supabase.functions.invoke("ada-generate-image", { body: { prompt: prompt.trim(), model: "google/gemini-2.5-flash-image" } });
      if (res.error) throw new Error(res.error.message);
      const data = res.data as any;
      let url: string | null = data?.image_url || data?.url || data?.images?.[0]?.url || null;
      if (!url && data?.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
        url = data.choices[0].message.images[0].image_url.url;
      }
      if (!url) throw new Error("No image returned");
      setPreview(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the image you want..." className="flex-1 text-sm" onKeyDown={(e) => e.key === "Enter" && generate()} />
        <Button size="sm" onClick={generate} disabled={generating || !prompt.trim()} className="gap-1.5">
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Generate
        </Button>
      </div>
      {generating && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      )}
      {preview && !generating && (
        <div className="space-y-2">
          <img src={preview} alt="AI generated" className="w-full max-h-[300px] object-contain rounded-lg border border-border" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={generate}>Regenerate</Button>
            <Button size="sm" onClick={() => onSelect(preview)}>Use This Image</Button>
          </div>
        </div>
      )}
    </div>
  );
}
