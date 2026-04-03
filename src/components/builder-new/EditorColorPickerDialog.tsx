import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

interface EditorColorPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (color: string) => void;
  currentColor?: string;
}

const PRESET_COLORS = [
  // Row 1 - Warm
  "#F97316", "#EF4444", "#F59E0B", "#D97706", "#DC2626", "#BE185D",
  // Row 2 - Cool
  "#3B82F6", "#6366F1", "#8B5CF6", "#06B6D4", "#14B8A6", "#0EA5E9",
  // Row 3 - Nature
  "#22C55E", "#16A34A", "#84CC16", "#65A30D", "#10B981", "#059669",
  // Row 4 - Neutral
  "#1F2937", "#374151", "#6B7280", "#9CA3AF", "#F3F4F6", "#FFFFFF",
];

export function EditorColorPickerDialog({ open, onOpenChange, onSelect, currentColor }: EditorColorPickerDialogProps) {
  const [selected, setSelected] = useState(currentColor || "#F97316");
  const [customHex, setCustomHex] = useState(currentColor || "#F97316");

  const handlePresetClick = (color: string) => {
    setSelected(color);
    setCustomHex(color);
  };

  const handleCustomChange = (val: string) => {
    setCustomHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setSelected(val);
    }
  };

  const handleApply = () => {
    onSelect(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Choose Accent Color</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Color preview */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border-2 border-border shadow-sm" style={{ backgroundColor: selected }} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Selected Color</p>
              <p className="text-xs text-muted-foreground font-mono">{selected}</p>
            </div>
          </div>

          {/* Preset grid */}
          <div className="grid grid-cols-6 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handlePresetClick(color)}
                className="relative w-full aspect-square rounded-lg border-2 transition-all hover:scale-110"
                style={{
                  backgroundColor: color,
                  borderColor: selected === color ? "hsl(var(--accent))" : "transparent",
                }}
              >
                {selected === color && (
                  <Check className="h-3.5 w-3.5 absolute inset-0 m-auto" style={{ color: isLightColor(color) ? "#000" : "#fff" }} />
                )}
              </button>
            ))}
          </div>

          {/* Custom hex + native picker */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selected}
              onChange={(e) => { setSelected(e.target.value); setCustomHex(e.target.value); }}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5"
            />
            <Input
              value={customHex}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="#F97316"
              className="flex-1 text-sm font-mono"
            />
          </div>

          {/* Apply */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={handleApply}>Apply Color</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}
