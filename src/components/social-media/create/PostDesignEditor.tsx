import { useState } from "react";
import { X, Type, Image, Shapes, Mountain, Maximize2, Palette, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

type ToolTab = "text" | "images" | "elements" | "background" | "size" | "palettes" | "templates";

const TOOLS: { key: ToolTab; icon: any; label: string }[] = [
  { key: "text", icon: Type, label: "Text" },
  { key: "images", icon: Image, label: "Images" },
  { key: "elements", icon: Shapes, label: "Elements" },
  { key: "background", icon: Mountain, label: "Background" },
  { key: "size", icon: Maximize2, label: "Size" },
  { key: "palettes", icon: Palette, label: "Palettes" },
  { key: "templates", icon: LayoutGrid, label: "Templates" },
];

const SIZE_PRESETS = [
  { label: "Square Post", ratio: "1:1", w: 1080, h: 1080, icon: "📱" },
  { label: "Instagram Post", ratio: "4:5", w: 1080, h: 1350, icon: "📸" },
  { label: "Story / Reel", ratio: "9:16", w: 1080, h: 1920, icon: "🎬" },
  { label: "Pinterest Post", ratio: "2:3", w: 1000, h: 1500, icon: "📌" },
];

interface Props {
  onClose: () => void;
}

export function PostDesignEditor({ onClose }: Props) {
  const [activeTool, setActiveTool] = useState<ToolTab>("text");
  const [canvasW, setCanvasW] = useState(1080);
  const [canvasH, setCanvasH] = useState(1080);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">Image Post Editor</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="accent" size="sm" onClick={onClose}>Save and Close</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Tool rail */}
        <div className="shrink-0 w-16 border-r border-border bg-card flex flex-col items-center py-3 gap-1">
          {TOOLS.map((tool) => (
            <button
              key={tool.key}
              onClick={() => setActiveTool(tool.key)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg w-14 transition-colors ${
                activeTool === tool.key
                  ? "bg-accent/15 text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <tool.icon className="h-4 w-4" />
              <span className="text-[10px] font-medium">{tool.label}</span>
            </button>
          ))}
        </div>

        {/* Tool panel */}
        <div className="shrink-0 w-64 border-r border-border bg-card overflow-y-auto p-4">
          {activeTool === "text" && <TextToolPanel />}
          {activeTool === "size" && (
            <SizeToolPanel
              canvasW={canvasW}
              canvasH={canvasH}
              onSize={(w, h) => { setCanvasW(w); setCanvasH(h); }}
            />
          )}
          {activeTool === "palettes" && <PalettesToolPanel />}
          {activeTool === "templates" && <TemplatesToolPanel />}
          {activeTool === "images" && <PlaceholderPanel label="Images" desc="Upload or pick from library" />}
          {activeTool === "elements" && <PlaceholderPanel label="Elements" desc="Shapes, stickers, and icons" />}
          {activeTool === "background" && <PlaceholderPanel label="Background" desc="Colors, gradients, and images" />}
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center bg-muted/20 p-8 overflow-auto">
          <div
            className="bg-white rounded shadow-lg relative"
            style={{
              width: Math.min(canvasW * 0.5, 500),
              height: Math.min(canvasH * 0.5, 600),
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            {/* Empty canvas placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-gray-300">Design canvas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TextToolPanel() {
  return (
    <div className="space-y-3">
      {["Header", "Body text", "Business name", "Tagline"].map((item) => (
        <button
          key={item}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors"
        >
          <span className="text-muted-foreground">+</span>
          {item}
        </button>
      ))}
    </div>
  );
}

function SizeToolPanel({ canvasW, canvasH, onSize }: { canvasW: number; canvasH: number; onSize: (w: number, h: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Width (px)</label>
          <input
            type="number"
            value={canvasW}
            onChange={(e) => onSize(Number(e.target.value) || 1080, canvasH)}
            className="w-full mt-1 px-2 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Height (px)</label>
          <input
            type="number"
            value={canvasH}
            onChange={(e) => onSize(canvasW, Number(e.target.value) || 1080)}
            className="w-full mt-1 px-2 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground"
          />
        </div>
      </div>
      <div className="space-y-2">
        {SIZE_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => onSize(p.w, p.h)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
              canvasW === p.w && canvasH === p.h
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-foreground hover:bg-muted"
            }`}
          >
            <span>{p.icon}</span>
            <span className="flex-1 text-left">{p.label}</span>
            <span className="text-xs text-muted-foreground">({p.ratio})</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PalettesToolPanel() {
  return (
    <div>
      <h3 className="text-xs font-semibold text-foreground mb-3">My Palettes</h3>
      <div className="flex gap-0 rounded-lg overflow-hidden border border-border">
        <div className="h-10 flex-1 bg-[#c47a3a]" />
        <div className="h-10 flex-1 bg-white" />
        <div className="h-10 flex-1 bg-[#152A20]" />
      </div>
    </div>
  );
}

function TemplatesToolPanel() {
  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button className="text-xs font-medium text-accent">Stock</button>
        <button className="text-xs font-medium text-muted-foreground hover:text-foreground">Library</button>
      </div>
      <p className="text-xs text-muted-foreground">Templates will appear here based on your plan.</p>
    </div>
  );
}

function PlaceholderPanel({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm font-medium text-foreground mb-1">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
