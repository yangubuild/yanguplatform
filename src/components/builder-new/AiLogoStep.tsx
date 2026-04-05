import { useState, useCallback, useEffect } from "react";
import { RefreshCw, Check, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { YanguLoader } from "@/components/YanguLoader";
import { recolorLogoToDataUrl, saveRecoloredLogo } from "./utils/logoColor";

interface AiLogoStepProps {
  businessName: string;
  category?: string;
  businessType?: string;
  menuType?: string;
  onConfirm: (logoUrl: string, color?: string) => void;
}

const PRESET_COLORS = [
  "#b5622a", "#e74c3c", "#2ecc71", "#3498db", "#9b59b6",
  "#1abc9c", "#f39c12", "#e67e22", "#34495e", "#d35400",
];

const STYLE_VARIANTS = [
  "clean professional wordmark with a balanced food emblem",
  "refined badge-style restaurant logo with strong readable typography",
  "modern typographic food brand mark with a subtle culinary symbol",
];

async function generateSingleLogo(
  businessName: string,
  color: string,
  variantIndex: number,
  category: string,
  businessType: string,
  menuType?: string,
  description?: string,
): Promise<{ url: string | null; source: string }> {
  const style = STYLE_VARIANTS[variantIndex % STYLE_VARIANTS.length];
  const styleHint = description ? `${style}. Additional requested style: ${description}.` : style;

  try {
    const { data, error } = await supabase.functions.invoke("generate-logo", {
      body: {
        businessName,
        category,
        businessType,
        menuType,
        color,
        palette: [color],
        style: styleHint,
      },
    });

    if (error) throw error;
    if (data?.code === "credits_exhausted") throw new Error("credits_exhausted");
    if (!data?.ok) throw new Error(data?.error || "Generation failed");

    return {
      url: data?.image_url || data?.logo_url || null,
      source: data?.source || "ai_generated",
    };
  } catch (err) {
    console.error(`AI logo variant ${variantIndex} failed:`, err);
    return { url: null, source: "ai_generated", error: err instanceof Error ? err.message : "" };
  }
}

export function AiLogoStep({ businessName, category = "emenu", businessType = "restaurant", menuType, onConfirm }: AiLogoStepProps) {
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [customDesc, setCustomDesc] = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [sourceLogos, setSourceLogos] = useState<(string | null)[]>([null, null, null]);
  const [displayLogos, setDisplayLogos] = useState<(string | null)[]>([null, null, null]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingSelection, setIsSavingSelection] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateLogos = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setSelectedIdx(null);

    try {
      const results = await Promise.all(
        [0, 1, 2].map((index) =>
          generateSingleLogo(
            businessName || "My Restaurant",
            selectedColor,
            index,
            category,
            businessType,
            menuType,
            customDesc || undefined,
          ),
        ),
      );
      const urls = results.map((r) => r.url);
      setSourceLogos(urls);
      setDisplayLogos(urls);
      setHasGenerated(true);

      if (urls.every((r) => r === null)) {
        const hasCreditsErr = results.some((r: any) => r.error === "credits_exhausted");
        setError(hasCreditsErr ? "AI credits are temporarily exhausted. Please try again later." : "Logo generation failed. Please try again.");
      }
    } catch (err) {
      console.error("Logo generation error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [businessName, selectedColor, customDesc, category, businessType, menuType]);

  useEffect(() => {
    if (!hasGenerated) {
      generateLogos();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (sourceLogos.every((logo) => !logo)) {
      setDisplayLogos(sourceLogos);
      return () => {
        cancelled = true;
      };
    }

    const applySelectedColor = async () => {
      const recolored = await Promise.all(
        sourceLogos.map(async (logoUrl) => {
          if (!logoUrl) return null;

          try {
            return await recolorLogoToDataUrl(logoUrl, selectedColor);
          } catch (recolorError) {
            console.warn("Failed to recolor logo preview:", recolorError);
            return logoUrl;
          }
        }),
      );

      if (!cancelled) {
        setDisplayLogos(recolored);
      }
    };

    void applySelectedColor();

    return () => {
      cancelled = true;
    };
  }, [sourceLogos, selectedColor]);

  const handleConfirm = useCallback(async () => {
    if (selectedIdx === null || !sourceLogos[selectedIdx]) return;

    setIsSavingSelection(true);
    setError(null);

    try {
      const savedLogo = await saveRecoloredLogo(sourceLogos[selectedIdx]!, selectedColor);
      onConfirm(savedLogo.url, selectedColor);
    } catch (saveError) {
      console.error("Selected logo save error:", saveError);
      const fallbackLogo = displayLogos[selectedIdx] || sourceLogos[selectedIdx];

      if (fallbackLogo) {
        onConfirm(fallbackLogo, selectedColor);
        return;
      }

      setError("Could not apply your selected logo color. Please try again.");
    } finally {
      setIsSavingSelection(false);
    }
  }, [selectedIdx, sourceLogos, displayLogos, selectedColor, onConfirm]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-[88%]">
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <YanguLoader size={36} fullArea={false} label="Generating logos..." />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {displayLogos.map((src, i) => (
            <button
              key={`logo-${i}-${src?.slice(-8) || "empty"}`}
              onClick={() => sourceLogos[i] && setSelectedIdx(i)}
              disabled={!sourceLogos[i]}
              className={`relative rounded-xl border-2 p-2 bg-card transition-all aspect-square flex items-center justify-center overflow-hidden ${
                selectedIdx === i
                  ? "border-primary ring-2 ring-primary/30"
                  : sourceLogos[i]
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

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Palette className="h-3.5 w-3.5" /> Logo Color
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
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
              onChange={(e) => setSelectedColor(e.target.value)}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={customDesc}
          onChange={(e) => setCustomDesc(e.target.value)}
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

      <button
        onClick={() => void handleConfirm()}
        disabled={selectedIdx === null || !sourceLogos[selectedIdx] || isSavingSelection}
        className="self-start px-6 py-2.5 text-sm font-semibold rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60"
      >
        {isSavingSelection ? "Applying Logo..." : "Use This Logo ✓"}
      </button>
    </div>
  );
}
