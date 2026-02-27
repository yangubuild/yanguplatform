/**
 * Google Business Profile search + select UI.
 * Uses Google Places Autocomplete via edge function when available.
 * Falls back to manual entry.
 */

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Search, X, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export interface GoogleBusinessResult {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  category?: string;
  placeId?: string;
  description?: string;
  photos?: string[];
  googleMapsUrl?: string;
}

interface Prediction {
  placeId: string;
  name: string;
  address: string;
  description: string;
}

interface Props {
  onSelect: (result: GoogleBusinessResult) => void;
  onBack: () => void;
}

export function GoogleBusinessSearch({ onSelect, onBack }: Props) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selected, setSelected] = useState<GoogleBusinessResult | null>(null);
  const [mode, setMode] = useState<"search" | "manual">("search");
  const [searching, setSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setPredictions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data, error } = await supabase.functions.invoke("google-places-proxy", {
          body: { action: "autocomplete", query: q.trim() },
        });
        if (data?.ok && data.results) {
          setPredictions(data.results);
        } else {
          // Fallback: show user-typed name as suggestion
          setPredictions([{ placeId: "", name: q.trim(), address: "Enter location manually", description: q.trim() }]);
        }
      } catch {
        setPredictions([{ placeId: "", name: q.trim(), address: "Enter location manually", description: q.trim() }]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const handleSelectPrediction = async (pred: Prediction) => {
    setPredictions([]);
    setQuery(pred.name);

    if (pred.placeId) {
      setLoadingDetails(true);
      try {
        const { data } = await supabase.functions.invoke("google-places-proxy", {
          body: { action: "details", placeId: pred.placeId },
        });
        if (data?.ok && data.place) {
          setSelected(data.place);
          setLoadingDetails(false);
          return;
        }
      } catch { /* fall through */ }
      setLoadingDetails(false);
    }

    setSelected({ name: pred.name, address: pred.address });
  };

  const handleSubmit = () => {
    if (mode === "manual") {
      if (!manualName.trim()) return;
      onSelect({ name: manualName.trim(), address: manualLocation.trim(), website: manualUrl.trim() || undefined });
    } else if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          Find Your Business on Google <span className="text-lg">📍</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Search for your business name to import your info, or enter details manually.
        </p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant={mode === "search" ? "default" : "outline"} onClick={() => setMode("search")}>
          <Search className="h-3.5 w-3.5 mr-1.5" /> Search
        </Button>
        <Button size="sm" variant={mode === "manual" ? "default" : "outline"} onClick={() => setMode("manual")}>
          Paste link / Enter manually
        </Button>
      </div>

      {mode === "search" ? (
        <div className="space-y-3">
          <div className="relative">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search your business name..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                autoFocus
              />
              {searching && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
              {query && !searching && (
                <button onClick={() => { setQuery(""); setPredictions([]); setSelected(null); }}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {predictions.length > 0 && !selected && (
              <div className="absolute left-0 right-0 mt-1 z-10 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                {predictions.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectPrediction(p)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.address}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadingDetails && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading business details…
            </div>
          )}

          {selected && !loadingDetails && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm text-foreground">{selected.name}</span>
                </div>
                <button onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground">Change</button>
              </div>
              <p className="text-xs text-muted-foreground">{selected.address}</p>
              {selected.phone && <p className="text-xs text-muted-foreground">📞 {selected.phone}</p>}
              {selected.website && <p className="text-xs text-muted-foreground truncate">🌐 {selected.website}</p>}
              {selected.category && <p className="text-xs text-muted-foreground">🏷️ {selected.category}</p>}
              {selected.description && <p className="text-xs text-muted-foreground italic">{selected.description}</p>}
              {selected.photos && selected.photos.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pt-1">
                  {selected.photos.slice(0, 4).map((url, i) => (
                    <img key={i} src={url} alt={`${selected.name} photo ${i + 1}`} className="h-14 w-14 rounded object-cover shrink-0" />
                  ))}
                  {selected.photos.length > 4 && (
                    <div className="h-14 w-14 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">
                      +{selected.photos.length - 4}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <Button onClick={handleSubmit} disabled={!selected || loadingDetails} className="w-full gap-2">
            <Sparkles className="h-4 w-4" /> Next Step <ArrowLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Business Name *</Label>
            <Input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="e.g. Kafeero Foundation" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Location</Label>
            <Input value={manualLocation} onChange={(e) => setManualLocation(e.target.value)} placeholder="e.g. Kalungi Road, Kampala" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Google Business URL (optional)</Label>
            <Input value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} placeholder="https://g.page/..." />
          </div>
          <Button onClick={handleSubmit} disabled={!manualName.trim()} className="w-full gap-2">
            <Sparkles className="h-4 w-4" /> Import & Generate
          </Button>
        </div>
      )}

      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back the previous step
      </button>
    </div>
  );
}
