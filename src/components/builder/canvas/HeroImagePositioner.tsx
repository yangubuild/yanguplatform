import { useCallback, useRef, useState } from "react";
import { Move, ZoomIn, ZoomOut, Check } from "lucide-react";

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
const ZOOM_STEP = 0.1;

function parsePosition(pos: string | undefined): { x: number; y: number } {
  if (!pos) return { x: 50, y: 50 };
  const parts = pos.replace(/%/g, "").trim().split(/\s+/);
  return {
    x: parseFloat(parts[0]) || 50,
    y: parseFloat(parts[1]) || 50,
  };
}

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
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; startPos: { x: number; y: number } } | null>(null);

  const pos = parsePosition(position);
  const effectiveZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isRepositioning) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        startPos: parsePosition(position),
      };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!dragStart.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        // Moving mouse right → image pans left → decrease x%
        const dx = ((ev.clientX - dragStart.current.x) / rect.width) * 100;
        const dy = ((ev.clientY - dragStart.current.y) / rect.height) * 100;
        // Sensitivity scales with zoom
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

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    onZoomChange(Math.min(MAX_ZOOM, effectiveZoom + ZOOM_STEP));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    onZoomChange(Math.max(MIN_ZOOM, effectiveZoom - ZOOM_STEP));
  };

  const toggleReposition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRepositioning((prev) => !prev);
  };

  if (!src) {
    return (
      <div
        className={`bg-muted flex items-center justify-center text-muted-foreground text-xs ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          onImageReplace?.();
        }}
      >
        No image
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative group/hero-img overflow-hidden ${className}`}
      onMouseDown={handleMouseDown}
      style={{ cursor: isRepositioning ? (isDragging ? "grabbing" : "grab") : undefined }}
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

      {/* Controls toolbar — visible on hover or when repositioning */}
      <div
        className={`absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2 py-1 z-20 transition-opacity ${
          isRepositioning ? "opacity-100" : "opacity-0 group-hover/hero-img:opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Reposition toggle */}
        <button
          type="button"
          onClick={toggleReposition}
          className={`p-1.5 rounded-full transition-colors ${
            isRepositioning
              ? "bg-primary text-primary-foreground"
              : "text-white hover:bg-white/20"
          }`}
          title={isRepositioning ? "Done repositioning" : "Reposition image"}
        >
          {isRepositioning ? <Check className="h-3.5 w-3.5" /> : <Move className="h-3.5 w-3.5" />}
        </button>

        {/* Zoom controls */}
        <div className="w-px h-4 bg-white/30" />
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1.5 rounded-full text-white hover:bg-white/20 transition-colors disabled:opacity-30"
          disabled={effectiveZoom <= MIN_ZOOM}
          title="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="text-white text-[10px] font-medium min-w-[2rem] text-center tabular-nums">
          {Math.round(effectiveZoom * 100)}%
        </span>
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1.5 rounded-full text-white hover:bg-white/20 transition-colors disabled:opacity-30"
          disabled={effectiveZoom >= MAX_ZOOM}
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>

        {/* Replace image */}
        {onImageReplace && (
          <>
            <div className="w-px h-4 bg-white/30" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onImageReplace();
              }}
              className="px-2 py-1 rounded-full text-white text-[10px] font-medium hover:bg-white/20 transition-colors"
              title="Replace image"
            >
              Replace
            </button>
          </>
        )}
      </div>

      {/* Reposition guide overlay */}
      {isRepositioning && (
        <div className="absolute inset-0 border-2 border-dashed border-primary/60 pointer-events-none z-10">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-full">
            Drag to reposition
          </div>
        </div>
      )}
    </div>
  );
}
