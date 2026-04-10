import { useState } from "react";
import { X, Heart, Pipette } from "lucide-react";

interface ColorPopupProps {
  onClose: () => void;
  onApply: (color: string) => void;
  currentColor?: string;
  label?: string;
}

const BRAND_COLORS = [
  "#1a1a5e", "#2d2a6e", "#3d3a8e", "#8888bb", "#d0d0e0", "#f5f5f5",
  "#f5c6c6", "#e8a0a0", "#c87070", "#b04040", "#ffffff", "#e0e0e0",
];

export function ColorPopup({ onClose, onApply, currentColor, label }: ColorPopupProps) {
  const [tab, setTab] = useState<"brand" | "custom">("brand");
  const [customHex, setCustomHex] = useState(currentColor || "#000000");
  const [hue, setHue] = useState(0);

  return (
    <div className="w-[250px] bg-background rounded-xl shadow-2xl border border-border/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-sm font-semibold text-foreground">{label || "Color Picker"}</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-muted transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mb-3 rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => setTab("brand")}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${tab === "brand" ? "bg-muted text-primary" : "text-muted-foreground"}`}
        >Brand</button>
        <button
          onClick={() => setTab("custom")}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${tab === "custom" ? "bg-muted text-primary" : "text-muted-foreground"}`}
        >Custom</button>
      </div>

      {tab === "brand" ? (
        <div className="px-4 pb-3 space-y-2">
          <p className="text-xs text-muted-foreground">Color palette</p>
          <div className="grid grid-cols-6 gap-2">
            {BRAND_COLORS.map(c => (
              <button
                key={c}
                onClick={() => onApply(c)}
                className="w-full aspect-square rounded-full border-2 hover:scale-110 transition-transform"
                style={{ backgroundColor: c, borderColor: currentColor === c ? "hsl(var(--primary))" : "transparent" }}
              />
            ))}
          </div>
          <button className="flex items-center gap-1.5 text-xs text-primary font-medium mt-2 hover:underline">
            <Heart className="h-3 w-3" /> Edit Brand Colors
          </button>
        </div>
      ) : (
        <div className="px-4 pb-3 space-y-3">
          {/* Color area */}
          <div
            className="w-full h-[140px] rounded-lg cursor-crosshair relative"
            style={{
              background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`,
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width;
              const y = (e.clientY - rect.top) / rect.height;
              const s = Math.round(x * 100);
              const l = Math.round((1 - y) * 50);
              const hex = hslToHex(hue, s, l);
              setCustomHex(hex);
            }}
          />

          {/* Hue slider */}
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={e => setHue(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none"
            style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
          />

          {/* Hex input */}
          <div className="flex items-center gap-2">
            <Pipette className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1 flex-1 border border-border rounded-lg px-2 py-1.5">
              <span className="text-xs text-muted-foreground">#</span>
              <input
                value={customHex.replace("#", "")}
                onChange={e => {
                  const v = "#" + e.target.value;
                  setCustomHex(v);
                  if (/^#[0-9A-Fa-f]{6}$/.test(v)) onApply(v);
                }}
                className="flex-1 bg-transparent text-sm font-mono outline-none"
                maxLength={6}
              />
            </div>
            <div className="w-7 h-7 rounded-full border border-border" style={{ backgroundColor: customHex }} />
          </div>

          <button
            onClick={() => onApply(customHex)}
            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
          >
            <Heart className="h-3 w-3" /> Save to Brand
          </button>
        </div>
      )}
    </div>
  );
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
