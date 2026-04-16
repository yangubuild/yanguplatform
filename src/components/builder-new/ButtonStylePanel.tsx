/**
 * ButtonStylePanel — Right-panel for global/per-button styling.
 * Controls: color, border-radius, size, with a global toggle.
 */
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

interface ButtonStylePanelProps {
  onAction: (action: string, payload?: any) => void;
  initialColor?: string;
  initialRadius?: string;
  initialSizeIndex?: number;
}

const PRESET_COLORS = [
  "#10b981", "#059669", "#22c55e", "#3b82f6", "#6366f1",
  "#ef4444", "#f59e0b", "#ec4899", "#1a1a1a", "#ffffff",
];

const RADIUS_OPTIONS = [
  { label: "Square", value: "4px" },
  { label: "Rounded", value: "8px" },
  { label: "Pill", value: "999px" },
];

const SIZE_OPTIONS = [
  { label: "Small", padding: "6px 12px", fontSize: "12px" },
  { label: "Medium", padding: "8px 0", fontSize: "13px" },
  { label: "Large", padding: "12px 0", fontSize: "15px" },
];

export function ButtonStylePanel({ onAction, initialColor, initialRadius, initialSizeIndex }: ButtonStylePanelProps) {
  const [selectedColor, setSelectedColor] = useState(initialColor || "#10b981");
  const [selectedRadius, setSelectedRadius] = useState(initialRadius || "8px");
  const [selectedSize, setSelectedSize] = useState(initialSizeIndex ?? 1);
  const [applyGlobally, setApplyGlobally] = useState(true);

  // Sync when initial values change (e.g. iframe loads saved data)
  useEffect(() => {
    if (initialColor) setSelectedColor(initialColor);
  }, [initialColor]);
  useEffect(() => {
    if (initialRadius) setSelectedRadius(initialRadius);
  }, [initialRadius]);

  const applyStyles = (color?: string, radius?: string, sizeIdx?: number) => {
    const c = color ?? selectedColor;
    const r = radius ?? selectedRadius;
    const s = SIZE_OPTIONS[sizeIdx ?? selectedSize];

    onAction("set_product_button_style", {
      color: c,
      borderRadius: r,
      padding: s.padding,
      fontSize: s.fontSize,
      global: applyGlobally,
    });
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold">Button Style</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Customize product button appearance
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Color */}
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Color</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { setSelectedColor(c); applyStyles(c); }}
                className={`w-7 h-7 rounded-lg border-2 transition-all ${
                  selectedColor === c ? "border-primary scale-110 shadow-sm" : "border-border hover:border-muted-foreground"
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Radius */}
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Shape</Label>
          <div className="flex gap-2">
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSelectedRadius(opt.value); applyStyles(undefined, opt.value); }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  selectedRadius === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Size</Label>
          <div className="flex gap-2">
            {SIZE_OPTIONS.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => { setSelectedSize(idx); applyStyles(undefined, undefined, idx); }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  selectedSize === idx
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Global toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <Label className="text-sm font-medium">Apply globally</Label>
            <p className="text-[11px] text-muted-foreground">All product buttons inherit this style</p>
          </div>
          <Switch checked={applyGlobally} onCheckedChange={setApplyGlobally} />
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
          <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide">Preview</p>
          <button
            style={{
              padding: SIZE_OPTIONS[selectedSize].padding,
              fontSize: SIZE_OPTIONS[selectedSize].fontSize,
              borderRadius: selectedRadius,
              border: `2px solid ${selectedColor}`,
              background: "transparent",
              color: selectedColor,
              fontWeight: 700,
              width: "100%",
              cursor: "default",
            }}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
