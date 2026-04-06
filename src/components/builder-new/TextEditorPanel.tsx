import { useState } from "react";
import {
  Type, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight,
} from "lucide-react";

interface TextEditorPanelProps {
  onAction: (action: string, payload?: any) => void;
  preview?: string;
}

const FONT_SIZES = [
  { label: "S", value: "0.85rem" },
  { label: "M", value: "1rem" },
  { label: "L", value: "1.25rem" },
  { label: "XL", value: "1.6rem" },
];

const FONT_WEIGHTS = [
  { label: "Normal", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Bold", value: "700" },
];

const LINE_HEIGHTS = [
  { label: "Tight", value: "1.2" },
  { label: "Normal", value: "1.5" },
  { label: "Relaxed", value: "1.8" },
];

const LETTER_SPACINGS = [
  { label: "Tight", value: "-0.02em" },
  { label: "Normal", value: "0em" },
  { label: "Wide", value: "0.05em" },
];

const TEXT_COLORS = [
  "#ffffff", "#f3f4f6", "#9ca3af", "#6b7280",
  "#374151", "#1f2937", "#111827", "#000000",
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#d4a853",
];

const ALIGN_OPTIONS = [
  { value: "left", icon: AlignLeft },
  { value: "center", icon: AlignCenter },
  { value: "right", icon: AlignRight },
];

export function TextEditorPanel({ onAction, preview }: TextEditorPanelProps) {
  const [fontSize, setFontSize] = useState("1rem");
  const [fontWeight, setFontWeight] = useState("400");
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-green-500" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Text Editor</h3>
            {preview && <p className="text-[10px] text-muted-foreground truncate">{preview}</p>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Font Size */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Size</label>
          <div className="flex gap-1">
            {FONT_SIZES.map((s) => (
              <button
                key={s.value}
                onClick={() => { setFontSize(s.value); onAction("set_text_style", { fontSize: s.value }); }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  fontSize === s.value ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font Weight */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Weight</label>
          <div className="flex gap-1">
            {FONT_WEIGHTS.map((w) => (
              <button
                key={w.value}
                onClick={() => { setFontWeight(w.value); onAction("set_text_style", { fontWeight: w.value }); }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  fontWeight === w.value ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted text-foreground"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Style toggles */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Style</label>
          <div className="flex gap-1.5">
            <button
              onClick={() => { setIsItalic(!isItalic); onAction("set_text_style", { fontStyle: !isItalic ? "italic" : "normal" }); }}
              className={`p-2 rounded-md transition-colors ${isItalic ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted text-foreground"}`}
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setIsUnderline(!isUnderline); onAction("set_text_style", { textDecoration: !isUnderline ? "underline" : "none" }); }}
              className={`p-2 rounded-md transition-colors ${isUnderline ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted text-foreground"}`}
            >
              <Underline className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Alignment */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Align</label>
          <div className="flex gap-1">
            {ALIGN_OPTIONS.map((a) => (
              <button
                key={a.value}
                onClick={() => onAction("set_text_style", { textAlign: a.value })}
                className="flex-1 flex items-center justify-center py-2 rounded-md bg-muted/60 hover:bg-muted text-foreground transition-colors"
              >
                <a.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Line Height */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Line Height</label>
          <div className="flex gap-1">
            {LINE_HEIGHTS.map((lh) => (
              <button
                key={lh.value}
                onClick={() => onAction("set_text_style", { lineHeight: lh.value })}
                className="flex-1 py-1.5 rounded-md text-xs font-medium bg-muted/60 hover:bg-muted text-foreground transition-colors"
              >
                {lh.label}
              </button>
            ))}
          </div>
        </div>

        {/* Letter Spacing */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Spacing</label>
          <div className="flex gap-1">
            {LETTER_SPACINGS.map((ls) => (
              <button
                key={ls.value}
                onClick={() => onAction("set_text_style", { letterSpacing: ls.value })}
                className="flex-1 py-1.5 rounded-md text-xs font-medium bg-muted/60 hover:bg-muted text-foreground transition-colors"
              >
                {ls.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Color */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Color</label>
          <div className="grid grid-cols-8 gap-1.5">
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onAction("set_text_style", { color: c })}
                title={c}
                className="w-full aspect-square rounded-md border border-border/50 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-2.5 border-t border-border shrink-0">
        <p className="text-[10px] text-muted-foreground">Click text in preview to edit content directly.</p>
      </div>
    </div>
  );
}
