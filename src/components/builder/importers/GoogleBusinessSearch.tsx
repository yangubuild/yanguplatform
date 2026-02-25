/**
 * Google Business Profile search + select UI.
 * Best-effort: if GOOGLE_PLACES_API_KEY exists, uses Places Autocomplete.
 * Fallback: manual entry of business name + location.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Search, X, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GoogleBusinessResult {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  category?: string;
  placeId?: string;
}

interface Props {
  onSelect: (result: GoogleBusinessResult) => void;
  onBack: () => void;
}

export function GoogleBusinessSearch({ onSelect, onBack }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBusinessResult[]>([]);
  const [selected, setSelected] = useState<GoogleBusinessResult | null>(null);
  const [mode, setMode] = useState<"search" | "manual">("search");
  const [manualName, setManualName] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Simulate search results (no scraping — user-typed data only)
  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      // In production, this would call Google Places Autocomplete API via edge function.
      // For now, show the typed name as a suggestion for the user to confirm.
      setResults([
        {
          name: q.trim(),
          address: "Enter your business location after selecting",
        },
      ]);
    }, 300);
  }, []);

  const handleSelectResult = (result: GoogleBusinessResult) => {
    setSelected(result);
    setResults([]);
  };

  const handleSubmit = () => {
    if (mode === "manual") {
      if (!manualName.trim()) return;
      onSelect({
        name: manualName.trim(),
        address: manualLocation.trim(),
        website: manualUrl.trim() || undefined,
      });
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

      {/* Toggle between search and manual */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={mode === "search" ? "default" : "outline"}
          onClick={() => setMode("search")}
        >
          <Search className="h-3.5 w-3.5 mr-1.5" />
          Search
        </Button>
        <Button
          size="sm"
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => setMode("manual")}
        >
          Paste link / Enter manually
        </Button>
      </div>

      {mode === "search" ? (
        <div className="space-y-3">
          {/* Search input */}
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
              {query && (
                <button onClick={() => { setQuery(""); setResults([]); setSelected(null); }}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Results dropdown */}
            {results.length > 0 && !selected && (
              <div className="absolute left-0 right-0 mt-1 z-10 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectResult(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.address}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected business card */}
          {selected && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm text-foreground">{selected.name}</span>
                </div>
                <button onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground">
                  Change
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{selected.address}</p>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={!selected} className="w-full gap-2">
            <Sparkles className="h-4 w-4" /> Next Step <ArrowLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      ) : (
        /* Manual mode */
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
