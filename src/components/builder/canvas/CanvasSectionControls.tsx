import { useState } from "react";
import { GripVertical, EyeOff, Trash2 } from "lucide-react";

interface CanvasSectionControlsProps {
  sectionId: string;
  sectionType: string;
  onHide: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CanvasSectionControls({
  sectionId,
  sectionType,
  onHide,
  onDelete,
}: CanvasSectionControlsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover/section:opacity-100 transition-opacity z-10"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="p-1 rounded bg-background border border-border shadow-sm hover:bg-accent transition-colors cursor-grab"
        title="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <button
        onClick={() => onHide(sectionId)}
        className="p-1 rounded bg-background border border-border shadow-sm hover:bg-accent transition-colors"
        title="Hide section"
      >
        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="p-1 rounded bg-background border border-border shadow-sm hover:bg-destructive/10 transition-colors"
          title="Delete section"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      ) : (
        <button
          onClick={() => { onDelete(sectionId); setConfirmDelete(false); }}
          onMouseLeave={() => setConfirmDelete(false)}
          className="p-1 rounded bg-destructive border border-destructive shadow-sm transition-colors"
          title="Confirm delete"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive-foreground" />
        </button>
      )}
    </div>
  );
}
