import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export interface CropData {
  x: number;
  y: number;
  scale: number;
}

interface CoverCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (cropData: CropData) => Promise<void>;
  aspectRatio?: number; // width / height
}

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const COVER_ASPECT = 16 / 5; // ~3.2 matching the 200px height on ~640px width

export default function CoverCropModal({
  open,
  onOpenChange,
  imageUrl,
  onSave,
  aspectRatio = COVER_ASPECT,
}: CoverCropModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  // Reset state when a new image opens
  useEffect(() => {
    if (open) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [open, imageUrl]);

  const clampPosition = useCallback(
    (x: number, y: number, s: number) => {
      const container = containerRef.current;
      if (!container || !naturalSize.w) return { x: 0, y: 0 };
      const cw = container.clientWidth;
      const ch = container.clientHeight;

      // How big is the image at current scale?
      // The image fills the container width, so base width = cw, base height = cw * (naturalH/naturalW)
      const baseH = cw * (naturalSize.h / naturalSize.w);
      const scaledW = cw * s;
      const scaledH = baseH * s;

      const maxX = Math.max(0, (scaledW - cw) / 2);
      const maxY = Math.max(0, (scaledH - ch) / 2);

      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
      };
    },
    [naturalSize]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const newPos = clampPosition(posStart.current.x + dx, posStart.current.y + dy, scale);
    setPosition(newPos);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY> 0 ? -0.1 : 0.1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
    setScale(newScale);
    setPosition(clampPosition(position.x, position.y, newScale));
  };

  const handleScaleChange = (val: number[]) => {
    const newScale = val[0];
    setScale(newScale);
    setPosition(clampPosition(position.x, position.y, newScale));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ x: position.x, y: position.y, scale });
      onOpenChange(false);
    } catch {
      // parent handles error
    } finally {
      setSaving(false);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setImageLoaded(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] p-0 gap-0 overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-foreground text-base">Adjust cover image</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Drag to reposition. Zoom to adjust framing.
          </p>
        </DialogHeader>

        {/* Preview area */}
        <div
          ref={containerRef}
          className="relative mx-5 rounded-xl overflow-hidden select-none"
          style={{
            aspectRatio: `${aspectRatio}`,
            background: "#1a2129",
            cursor: isDragging.current ? "grabbing" : "grab",
            touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}>
          <img
            src={imageUrl}
            alt="Cover preview"
            onLoad={handleImageLoad}
            draggable={false}
            className="absolute pointer-events-none"
            style={{
              width: "100%",
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
              transformOrigin: "center center",
              opacity: imageLoaded ? 1 : 0,
              transition: isDragging.current ? "none" : "opacity 0.2s" }}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-3 px-5 py-3">
          <ZoomOut className="w-4 h-4 shrink-0 text-muted-foreground" />
          <Slider
            value={[scale]}
            onValueChange={handleScaleChange}
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={0.05}
            className="flex-1"
          />
          <ZoomIn className="w-4 h-4 shrink-0 text-muted-foreground" />
        </div>

        {/* Actions */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-muted-foreground">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="text-xs font-semibold"
              style={{ background: "linear-gradient(135deg, #b5622a, #5c2a12)" }}>
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Save cover
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
