import { useState, useCallback } from "react";
import { RefreshCw, Check, Palette, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { YanguLoader } from "@/components/YanguLoader";

interface AiLogoStepProps {
  businessName: string;
  category?: string;
  onConfirm: (logoUrl: string, color?: string) => void;
}

const PRESET_COLORS = [
  "#b5622a", "#e74c3c", "#2ecc71", "#3498db", "#9b59b6",
  "#1abc9c", "#f39c12", "#e67e22", "#34495e", "#d35400",
];

export function AiLogoStep({ businessName, category = "emenu", onConfirm }: AiLogoStepProps) {
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [customDesc, setCustomDesc] = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [logos, setLogos] = useState<(string | null)[]>([null, null, null]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateLogos = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setSelectedIdx(null);
    const results: (string | null)[] = [null, null, null];

    try {
      // Generate 3 logos in parallel
      const promises = [0, 1, 2].map(async (i) => {
        try {
          const { data, error: fnError } = await supabase.functions.invoke("generate-logo", {
            body: {
              businessName: businessName || "My Restaurant",
              color: selectedColor,
              category,
              description: customDesc || undefined,
              variantIndex: i,
            },
          });
          if (fnError) throw fnError;
          return data?.imageUrl || null;
        } catch (err) {
          console.error(`Logo variant ${i} failed:`, err);
          return null;
        }
      });

      const urls = await Promise.all(promises);
      urls.forEach((url, i) => { results[i] = url; });
      setLogos(results);
      setHasGenerated(true);

      if (results.every(r => r === null)) {
        setError("Logo generation failed. Please try again.");
      }
    } catch (err) {
      console.error("Logo generation error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [businessName, selectedColor, category, customDesc]);

  // Auto-generate on first mount
  useState(() => {
    if (!hasGenerated) {
      generateLogos();
    }
  });

  const handleConfirm = useCallback(() => {
    if (selectedIdx !== null && logos[selectedIdx]) {
      onConfirm(logos[selectedIdx]!, selectedColor);
    }
  }, [selectedIdx, logos, selectedColor, onConfirm]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-[88%]">
      {/* Logo grid */}
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <YanguLoader size={36} fullArea={false} label="Generating logos..." />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {logos.map((src, i) => (
            <button
              key={`logo-${i}`}
              onClick={() => src && setSelectedIdx(i)}
              disabled={!src}
              className={`relative rounded-xl border-2 p-2 bg-card transition-all aspect-square flex items-center justify-center overflow-hidden ${
                selectedIdx === i
                  ? "border-primary ring-2 ring-primary/30"
                  : src
                  ? "border-border hover:border-primary/40"
                  : "border-border opacity-40"
              }`}
            >
              {src ? (
                <img src={src} alt={`Logo option ${i + 1}`} className="w-full h-full object-contain rounded-lg" />
              ) : (
                <span className="text-xs text-muted-foreground">Failed</span>
              )}
              {selectedIdx === i && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Color picker */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Palette className="h-3.5 w-3.5" /> Logo Color
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setSelectedColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                selectedColor === c ? "border-foreground scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
          <label className="w-7 h-7 rounded-full border-2 border-dashed border-border cursor-pointer overflow-hidden flex items-center justify-center text-[10px] text-muted-foreground">
            +
            <input
              type="color"
              value={selectedColor}
              onChange={e => setSelectedColor(e.target.value)}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Regenerate with description */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customDesc}
          onChange={e => setCustomDesc(e.target.value)}
          placeholder="Describe logo style (optional)"
          className="flex-1 px-3 py-2 text-xs rounded-lg bg-muted border border-border focus:border-primary/50 focus:outline-none"
        />
        <button
          onClick={generateLogos}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} /> Regenerate
        </button>
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={selectedIdx === null || !logos[selectedIdx]}
        className="self-start px-6 py-2.5 text-sm font-semibold rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60"
      >
        Use This Logo ✓
      </button>
    </div>
  );
}
