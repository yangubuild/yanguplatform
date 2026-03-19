import { useState } from "react";
import { EyeOff, Trash2 } from "lucide-react";

interface CanvasItemControlsProps {
  onHide: () => void;
  onDelete: () => void;
}

export function CanvasItemControls({ onHide, onDelete }: CanvasItemControlsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="absolute right-1 top-1 flex gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity z-10"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onHide(); }}
        className="p-0.5 rounded bg-background/90 border border-border shadow-sm hover:bg-accent transition-colors"
        title="Hide item"
      >
        <EyeOff className="h-3 w-3 text-muted-foreground" />
      </button>
      {!confirmDelete ? (
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
          className="p-0.5 rounded bg-background/90 border border-border shadow-sm hover:bg-destructive/10 transition-colors"
          title="Delete item"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground" />
        </button>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); setConfirmDelete(false); }}
          onMouseLeave={() => setConfirmDelete(false)}
          className="p-0.5 rounded bg-destructive border border-destructive shadow-sm transition-colors"
          title="Confirm delete"
        >
          <Trash2 className="h-3 w-3 text-destructive-foreground" />
        </button>
      )}
    </div>
  );
}
