import { useState } from "react";
import { X, Search, Loader2, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StockResult {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  author: string;
  sourceUrl: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (url: string, title: string) => Promise<void>;
}

const SUGGESTIONS = ["marketplace", "business meeting", "community gathering", "digital storefront", "live streaming"];

export function StockImageSearchModal({ open, onOpenChange, onSave }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const search = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setQuery(q);
    try {
      const { data, error } = await supabase.functions.invoke("builder-stock-search", {
        body: { query: q, mediaType: "image", page: 1 },
      });
      if (error) throw error;
      if (data?.ok) {
        setResults(data.results || []);
      } else {
        toast.error("Stock search failed");
      }
    } catch {
      toast.error("Could not search stock photos");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (r: StockResult) => {
    setSaving(r.id);
    try {
      await onSave(r.fullUrl, `Stock: ${query} - by ${r.author}`);
      onOpenChange(false);
    } catch {
      // error handled by parent
    } finally {
      setSaving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Stock photos</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search(query)}
            placeholder="Search stock photos..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent text-foreground placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Suggestions */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Suggested:</span>
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => search(s)} className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors">
              {s}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {results.map((r) => (
                <div key={r.id} className="relative group rounded-lg overflow-hidden aspect-square bg-muted cursor-pointer" onClick={() => handleSave(r)}>
                  <img src={r.thumbUrl} alt={r.author} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    {saving === r.id ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <Download className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate">{r.author}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <p className="text-center text-sm text-muted-foreground py-12">No results found</p>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-12">Search for stock photos above</p>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center">Photos provided by Pexels</p>
      </DialogContent>
    </Dialog>
  );
}
