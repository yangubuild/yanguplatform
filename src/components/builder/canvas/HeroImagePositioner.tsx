import { useCallback, useRef, useState } from "react";
import { Move, Upload, Check } from "lucide-react";

interface HeroImagePositionerProps {
  src: string;
  alt?: string;
  className?: string;
  /** "50% 50%" format */
  position?: string;
  /** 1 = 100%, 1.5 = 150% zoom */
  zoom?: number;
  onPositionChange: (position: string) => void;
  onZoomChange: (zoom: number) => void;
  onImageReplace?: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function parsePosition(pos: string | undefined): { x: number; y: number } {
  if (!pos) return { x: 50, y: 50 };
  const parts = pos.replace(/%/g, "").trim().split(/\s+/);
  return {
    x: parseFloat(parts[0]) || 50,
    y: parseFloat(parts[1]) || 50,
  };
}

/**
 * Hero image with click-to-show two options:
 *   1. Resize / Reposition  (enters drag + zoom mode)
 *   2. Replace Image        (opens file picker)
 */
export function HeroImagePositioner({
  src,
  alt = "Hero image",
  className = "",
  position,
  zoom = 1,
  onPositionChange,
  onZoomChange,
  onImageReplace,
}: HeroImagePositionerProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; startPos: { x: number; y: number } } | null>(null);

  const pos = parsePosition(position);
  const effectiveZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));

  /* ── Drag logic (only active in reposition mode) ── */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isRepositioning) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, startPos: parsePosition(position) };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!dragStart.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const dx = ((ev.clientX - dragStart.current.x) / rect.width) * 100;
        const dy = ((ev.clientY - dragStart.current.y) / rect.height) * 100;
        const sensitivity = effectiveZoom;
        const newX = Math.max(0, Math.min(100, dragStart.current.startPos.x - dx * sensitivity));
        const newY = Math.max(0, Math.min(100, dragStart.current.startPos.y - dy * sensitivity));
        onPositionChange(`${Math.round(newX)}% ${Math.round(newY)}%`);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        dragStart.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [isRepositioning, position, effectiveZoom, onPositionChange]
  );

  /* ── Click on image: show the two-option menu ── */
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRepositioning) return; // clicks in reposition mode are for dragging
    setShowOptions((prev) => !prev);
  };

  /* ── Option 1: Enter reposition mode ── */
  const enterReposition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOptions(false);
    setIsRepositioning(true);
  };

  /* ── Done repositioning ── */
  const finishReposition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRepositioning(false);
  };

  /* ── Zoom via scroll wheel in reposition mode ── */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!isRepositioning) return;
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      onZoomChange(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, effectiveZoom + delta)));
    },
    [isRepositioning, effectiveZoom, onZoomChange]
  );

  /* ── Option 2: Replace image ── */
  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOptions(false);
    onImageReplace?.();
  };

  if (!src) {
    return (
      <div
        className={`bg-muted flex items-center justify-center text-muted-foreground text-xs cursor-pointer ${className}`}
        onClick={(e) => { e.stopPropagation(); onImageReplace?.(); }}
      >
        <Upload className="h-5 w-5 mr-1.5" />
        Click to upload
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onClick={handleImageClick}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      style={{ cursor: isRepositioning ? (isDragging ? "grabbing" : "grab") : "pointer" }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="w-full h-full pointer-events-none select-none"
        style={{
          objectFit: "cover",
          objectPosition: `${pos.x}% ${pos.y}%`,
          transform: effectiveZoom > 1 ? `scale(${effectiveZoom})` : undefined,
          transformOrigin: `${pos.x}% ${pos.y}%`,
        }}
      />

      {/* ── Two-option popover (shown on click) ── */}
      {showOptions && !isRepositioning && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/40"
          onClick={(e) => { e.stopPropagation(); setShowOptions(false); }}
        >
          <div
            className="flex flex-col gap-2 bg-background/95 backdrop-blur-md rounded-xl shadow-lg border border-border p-3 min-w-[180px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={enterReposition}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
            >
              <Move className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground">Resize / Reposition</span>
            </button>
            {onImageReplace && (
              <button
                type="button"
                onClick={handleReplace}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
              >
                <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-foreground">Replace Image</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Reposition mode overlay ── */}
      {isRepositioning && (
        <>
          <div className="absolute inset-0 border-2 border-dashed border-primary/60 pointer-events-none z-10" />
          {/* Top instructions */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-primary text-primary-foreground text-[11px] font-medium px-3 py-1 rounded-full pointer-events-none shadow-md">
            Drag to reposition · Scroll to zoom
          </div>
          {/* Bottom toolbar */}
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white text-[11px] tabular-nums font-medium">
              {Math.round(effectiveZoom * 100)}%
            </span>
            <button
              type="button"
              onClick={finishReposition}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors"
            >
              <Check className="h-3 w-3" />
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
}
