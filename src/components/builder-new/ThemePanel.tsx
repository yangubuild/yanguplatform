import { X, Palette } from "lucide-react";

interface ThemePanelProps {
  open: boolean;
  onClose: () => void;
  onApply: (theme: ThemeValues) => void;
}

export interface ThemeValues {
  background?: string;
  foreground?: string;
  primary?: string;
  cardBg?: string;
  fontFamily?: string;
}

const BG_COLORS = ["#000000", "#0a0a0a", "#111827", "#1a1a2e", "#0f172a", "#ffffff", "#f9fafb", "#fef3c7"];
const FG_COLORS = ["#ffffff", "#f3f4f6", "#e5e7eb", "#111827", "#000000", "#d4a853", "#22c55e", "#3b82f6"];
const PRIMARY_COLORS = ["#22c55e", "#f97316", "#3b82f6", "#ef4444", "#a855f7", "#d4a853", "#ec4899", "#14b8a6"];
const CARD_COLORS = ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.1)", "#1f2937", "#111827", "#ffffff", "#f9fafb"];
const FONTS = [
  { label: "System", value: "system-ui, sans-serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "DM Sans", value: "'DM Sans', sans-serif" },
  { label: "Playfair", value: "'Playfair Display', serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Mono", value: "'JetBrains Mono', monospace" },
];

export function ThemePanel({ open, onClose, onApply }: ThemePanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Theme</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-4 space-y-5">
          <ColorRow label="Background" colors={BG_COLORS} onPick={(c) => onApply({ background: c })} />
          <ColorRow label="Text" colors={FG_COLORS} onPick={(c) => onApply({ foreground: c })} />
          <ColorRow label="Accent / CTA" colors={PRIMARY_COLORS} onPick={(c) => onApply({ primary: c })} />
          <ColorRow label="Card Background" colors={CARD_COLORS} onPick={(c) => onApply({ cardBg: c })} />

          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-2">Font Family</label>
            <div className="grid grid-cols-3 gap-1.5">
              {FONTS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => onApply({ fontFamily: f.value })}
                  className="px-3 py-2 rounded-lg text-xs font-medium bg-muted/60 hover:bg-muted text-foreground transition-colors"
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorRow({ label, colors, onPick }: { label: string; colors: string[]; onPick: (c: string) => void }) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-2">{label}</label>
      <div className="flex gap-1.5 flex-wrap">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => onPick(c)}
            className="w-8 h-8 rounded-lg border border-border/50 hover:scale-110 transition-transform"
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}
