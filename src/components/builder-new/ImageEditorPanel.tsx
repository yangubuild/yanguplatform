import { useState } from "react";
import { Image as ImageIcon, Replace, Square, RectangleHorizontal } from "lucide-react";

interface ImageEditorPanelProps {
  onAction: (action: string, payload?: any) => void;
  preview?: string;
}

const ASPECT_RATIOS = [
  { label: "Auto", value: "auto" },
  { label: "1:1", value: "1/1" },
  { label: "4:3", value: "4/3" },
  { label: "16:9", value: "16/9" },
];

const OBJECT_FITS = [
  { label: "Cover", value: "cover" },
  { label: "Contain", value: "contain" },
];

const BORDER_RADII = [
  { label: "None", value: "0px" },
  { label: "S", value: "8px" },
  { label: "M", value: "16px" },
  { label: "L", value: "24px" },
  { label: "Full", value: "9999px" },
];

export function ImageEditorPanel({ onAction, preview }: ImageEditorPanelProps) {
  const [objectFit, setObjectFit] = useState("cover");
  const [radius, setRadius] = useState("0px");

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-blue-500" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Image Editor</h3>
            {preview && <p className="text-[10px] text-muted-foreground truncate">{preview.split("/").pop()?.substring(0, 30)}</p>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Replace */}
        <div>
          <button
            onClick={() => onAction("replace_image")}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
          >
            <Replace className="h-4 w-4" />
            Replace Image
          </button>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Aspect Ratio</label>
          <div className="flex gap-1">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.value}
                onClick={() => onAction("set_image_style", { aspectRatio: ar.value })}
                className="flex-1 py-1.5 rounded-md text-xs font-medium bg-muted/60 hover:bg-muted text-foreground transition-colors"
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>

        {/* Object Fit */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Fit</label>
          <div className="flex gap-1.5">
            {OBJECT_FITS.map((of_) => (
              <button
                key={of_.value}
                onClick={() => { setObjectFit(of_.value); onAction("set_image_style", { objectFit: of_.value }); }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  objectFit === of_.value ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted text-foreground"
                }`}
              >
                {of_.label}
              </button>
            ))}
          </div>
        </div>

        {/* Corner Radius */}
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Corners</label>
          <div className="flex gap-1">
            {BORDER_RADII.map((br) => (
              <button
                key={br.value}
                onClick={() => { setRadius(br.value); onAction("set_image_style", { borderRadius: br.value }); }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  radius === br.value ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted text-foreground"
                }`}
              >
                {br.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-2.5 border-t border-border shrink-0">
        <p className="text-[10px] text-muted-foreground">Click an image in preview to select it.</p>
      </div>
    </div>
  );
}
