import { useState } from "react";
import { Columns, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon } from "lucide-react";

interface SectionEditorPanelProps {
  onAction: (action: string, payload?: any) => void;
  preview?: string;
  sectionIndex?: number;
}

const BG_COLORS = [
  "#000000", "#0a0a0a", "#111827", "#1f2937",
  "#374151", "#1a1a2e", "#0f172a", "#18181b",
  "#ffffff", "#f9fafb", "#f3f4f6", "#e5e7eb",
  "#fef3c7", "#fee2e2", "#dbeafe", "#d1fae5",
];

const PADDING_OPTIONS = [
  { label: "None", value: "0px" },
  { label: "S", value: "32px" },
  { label: "M", value: "64px" },
  { label: "L", value: "96px" },
  { label: "XL", value: "128px" },
];

const ALIGN_OPTIONS = [
  { value: "left", icon: AlignLeft },
  { value: "center", icon: AlignCenter },
  { value: "right", icon: AlignRight },
];

export function SectionEditorPanel({ onAction, preview, sectionIndex }: SectionEditorPanelProps) {
  const [paddingY, setPaddingY] = useState("64px");

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Columns className="h-4 w-4 text-primary" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Section Editor</h3>
            <p className="text-[10px] text-muted-foreground truncate">
              {sectionIndex !== undefined ? `Section ${sectionIndex + 1}` : ""}
              {preview ? ` · ${preview}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Background Color */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Background</label>
          <div className="grid grid-cols-8 gap-1.5">
            {BG_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onAction("set_section_style", { backgroundColor: c })}
                title={c}
                className="w-full aspect-square rounded-md border border-border/50 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Background Image */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Background Image</label>
          <button
            onClick={() => onAction("set_section_bg_image")}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-muted/60 hover:bg-muted text-sm text-foreground transition-colors"
          >
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            Choose Image
          </button>
        </div>

        {/* Padding */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Padding</label>
          <div className="flex gap-1">
            {PADDING_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => { setPaddingY(p.value); onAction("set_section_style", { paddingTop: p.value, paddingBottom: p.value }); }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  paddingY === p.value ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Alignment */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Content Align</label>
          <div className="flex gap-1">
            {ALIGN_OPTIONS.map((a) => (
              <button
                key={a.value}
                onClick={() => onAction("set_section_style", { textAlign: a.value })}
                className="flex-1 flex items-center justify-center py-2 rounded-md bg-muted/60 hover:bg-muted text-foreground transition-colors"
              >
                <a.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-2.5 border-t border-border shrink-0">
        <p className="text-[10px] text-muted-foreground">Changes apply to selected section only.</p>
      </div>
    </div>
  );
}
