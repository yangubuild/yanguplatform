/**
 * CanvasDraggableOverlay — allows dragging a hero text/CTA group on the canvas.
 * Position is stored as percentage offsets (x%, y%) in the section schema.
 */
import { useState, useRef, useCallback } from "react";

interface CanvasDraggableOverlayProps {
  children: React.ReactNode;
  /** Current position as { x: number; y: number } percentages (0-100) */
  position?: { x: number; y: number };
  /** Called when drag ends with new position */
  onPositionChange?: (pos: { x: number; y: number }) => void;
  className?: string;
  disabled?: boolean;
}

export function CanvasDraggableOverlay({
  children,
  position,
  onPositionChange,
  className = "",
  disabled = false,
}: CanvasDraggableOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ mouseX: 0, mouseY: 0, elX: 0, elY: 0 });

  const posX = position?.x ?? 50;
  const posY = position?.y ?? 80;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || !onPositionChange) return;
      // Don't start drag on contentEditable elements
      const target = e.target as HTMLElement;
      if (target.isContentEditable || target.closest("[contenteditable]")) return;

      e.stopPropagation();
      e.preventDefault();
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

      const parent = containerRef.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      startRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        elX: (posX / 100) * rect.width,
        elY: (posY / 100) * rect.height,
      };
    },
    [disabled, onPositionChange, posX, posY]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !onPositionChange) return;
      const parent = containerRef.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();

      const dx = e.clientX - startRef.current.mouseX;
      const dy = e.clientY - startRef.current.mouseY;
      const newX = Math.max(0, Math.min(100, ((startRef.current.elX + dx) / rect.width) * 100));
      const newY = Math.max(0, Math.min(100, ((startRef.current.elY + dy) / rect.height) * 100));

      onPositionChange({ x: Math.round(newX), y: Math.round(newY) });
    },
    [dragging, onPositionChange]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  if (!onPositionChange) {
    // Read-only mode (public page) — just position absolutely
    return (
      <div
        className={`absolute ${className}`}
        style={{
          left: `${posX}%`,
          top: `${posY}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`absolute ${className} ${dragging ? "cursor-grabbing" : "cursor-grab"} select-none`}
      style={{
        left: `${posX}%`,
        top: `${posY}%`,
        transform: "translate(-50%, -50%)",
        zIndex: dragging ? 50 : 10,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {dragging && (
        <div className="absolute -inset-1 border-2 border-dashed border-primary/50 rounded-lg pointer-events-none" />
      )}
      {children}
    </div>
  );
}
