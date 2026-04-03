import { useState, useCallback } from "react";
import { RefreshCw, Check, Palette } from "lucide-react";

interface AiLogoStepProps {
  businessName: string;
  onConfirm: (logoUrl: string, color?: string) => void;
}

function generateLogoSvg(name: string, color: string, variant: number): string {
  const initial = name.charAt(0).toUpperCase();
  const shapes = [
    // Circle
    `<circle cx="64" cy="64" r="56" fill="${color}"/>
     <text x="64" y="82" text-anchor="middle" font-size="48" font-weight="bold" fill="white" font-family="Arial,sans-serif">${initial}</text>`,
    // Rounded rect
    `<rect x="8" y="8" width="112" height="112" rx="24" fill="${color}"/>
     <text x="64" y="82" text-anchor="middle" font-size="48" font-weight="bold" fill="white" font-family="Arial,sans-serif">${initial}</text>`,
    // Hex
    `<polygon points="64,4 118,34 118,94 64,124 10,94 10,34" fill="${color}"/>
     <text x="64" y="80" text-anchor="middle" font-size="44" font-weight="bold" fill="white" font-family="Arial,sans-serif">${initial}</text>`,
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">${shapes[variant % 3]}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

const PRESET_COLORS = [
  "#b5622a", "#e74c3c", "#2ecc71", "#3498db", "#9b59b6",
  "#1abc9c", "#f39c12", "#e67e22", "#34495e", "#d35400",
];

export function AiLogoStep({ businessName, onConfirm }: AiLogoStepProps) {
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [customDesc, setCustomDesc] = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [seed, setSeed] = useState(0);

  const logos = [0, 1, 2].map(i =>
    generateLogoSvg(businessName || "B", selectedColor, i + seed)
  );

  const handleRegenerate = useCallback(() => {
    setSeed(prev => prev + 3);
    setSelectedIdx(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedIdx !== null) {
      onConfirm(logos[selectedIdx], selectedColor);
    }
  }, [selectedIdx, logos, selectedColor, onConfirm]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-[88%]">
      {/* Logo grid */}
      <div className="grid grid-cols-3 gap-3">
        {logos.map((src, i) => (
          <button
            key={`${seed}-${i}`}
            onClick={() => setSelectedIdx(i)}
            className={`relative rounded-xl border-2 p-3 bg-card transition-all aspect-square flex items-center justify-center ${
              selectedIdx === i
                ? "border-primary ring-2 ring-primary/30"
                : "border-border hover:border-primary/40"
            }`}
          >
            <img src={src} alt={`Logo option ${i + 1}`} className="w-full h-full object-contain" />
            {selectedIdx === i && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Color picker */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Palette className="h-3.5 w-3.5" /> Logo Color
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setSelectedColor(c); setSelectedIdx(null); setSeed(prev => prev); }}
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
              onChange={e => { setSelectedColor(e.target.value); setSelectedIdx(null); }}
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
          onClick={handleRegenerate}
          className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Regenerate
        </button>
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={selectedIdx === null}
        className="self-start px-6 py-2.5 text-sm font-semibold rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60"
      >
        Use This Logo ✓
      </button>
    </div>
  );
}
