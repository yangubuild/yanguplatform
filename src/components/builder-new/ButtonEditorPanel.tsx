import { useState } from "react";
import { MousePointer, Palette, Square, RectangleHorizontal, Circle, AlignLeft, AlignCenter, AlignRight, Maximize, Minimize } from "lucide-react";

interface ButtonEditorPanelProps {
  onAction: (action: string, payload?: any) => void;
  preview?: string;
}

const BUTTON_COLORS = [
  { label: "Green", value: "#22c55e" },
  { label: "Orange", value: "#f97316" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Red", value: "#ef4444" },
  { label: "Purple", value: "#a855f7" },
  { label: "Black", value: "#1a1a1a" },
  { label: "White", value: "#ffffff" },
  { label: "Gold", value: "#d4a853" },
];

const BUTTON_SHAPES = [
  { label: "Rounded", value: "rounded", icon: RectangleHorizontal, radius: "8px" },
  { label: "Pill", value: "pill", icon: Circle, radius: "9999px" },
  { label: "Square", value: "square", icon: Square, radius: "0px" },
];

const BUTTON_SIZES = [
  { label: "Small", value: "sm", padding: "8px 16px", fontSize: "0.8rem" },
  { label: "Medium", value: "md", padding: "12px 24px", fontSize: "0.95rem" },
  { label: "Large", value: "lg", padding: "16px 32px", fontSize: "1.1rem" },
];

const BUTTON_ALIGN = [
  { label: "Left", value: "flex-start", icon: AlignLeft },
  { label: "Center", value: "center", icon: AlignCenter },
  { label: "Right", value: "flex-end", icon: AlignRight },
];

export function ButtonEditorPanel({ onAction, preview }: ButtonEditorPanelProps) {
  const [activeColor, setActiveColor] = useState<string>("#22c55e");
  const [activeShape, setActiveShape] = useState<string>("rounded");
  const [activeSize, setActiveSize] = useState<string>("md");

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <MousePointer className="h-4 w-4 text-amber-500" />
          <div>
            <h3 className="text-sm font-semibold">Button Editor</h3>
            {preview && <p className="text-[10px] text-muted-foreground truncate">{preview}</p>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {/* Color */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-2">Color</label>
          <div className="grid grid-cols-4 gap-2">
            {BUTTON_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  setActiveColor(c.value);
                  onAction("set_button_color", { color: c.value });
                }}
                title={c.label}
                className={`w-full aspect-square rounded-lg border-2 transition-all ${
                  activeColor === c.value ? "border-primary scale-110" : "border-transparent hover:border-muted-foreground/30"
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </div>

        {/* Shape */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-2">Shape</label>
          <div className="flex gap-1.5">
            {BUTTON_SHAPES.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setActiveShape(s.value);
                  onAction("set_button_shape", { radius: s.radius });
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeShape === s.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 hover:bg-muted text-foreground"
                }`}
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-2">Size</label>
          <div className="flex gap-1.5">
            {BUTTON_SIZES.map((sz) => (
              <button
                key={sz.value}
                onClick={() => {
                  setActiveSize(sz.value);
                  onAction("set_button_size", { padding: sz.padding, fontSize: sz.fontSize });
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeSize === sz.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 hover:bg-muted text-foreground"
                }`}
              >
                {sz.value === "sm" && <Minimize className="h-3 w-3" />}
                {sz.value === "lg" && <Maximize className="h-3 w-3" />}
                {sz.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alignment */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-2">Placement</label>
          <div className="flex gap-1.5">
            {BUTTON_ALIGN.map((a) => (
              <button
                key={a.value}
                onClick={() => onAction("set_button_align", { align: a.value })}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-muted/60 hover:bg-muted text-foreground transition-colors"
              >
                <a.icon className="h-3.5 w-3.5" />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-border shrink-0">
        <p className="text-[10px] text-muted-foreground">Click the button in preview to edit its label directly.</p>
      </div>
    </div>
  );
}