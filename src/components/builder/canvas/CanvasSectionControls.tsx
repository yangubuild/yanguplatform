import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!confirmDelete) return;

    const timeout = window.setTimeout(() => setConfirmDelete(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [confirmDelete]);

  return (
    <div
      className="absolute right-2 top-2 flex gap-0.5 opacity-0 group-hover/section:opacity-100 transition-opacity z-10"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="p-1 rounded bg-background border border-border shadow-sm hover:bg-accent transition-colors cursor-grab"
        title={`Drag to reorder ${sectionType} section`}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <button
        type="button"
        onClick={() => onHide(sectionId)}
        className="p-1 rounded bg-background border border-border shadow-sm hover:bg-accent transition-colors"
        title="Hide section"
      >
        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <button
        type="button"
        onClick={() => {
          if (confirmDelete) {
            onDelete(sectionId);
            setConfirmDelete(false);
            return;
          }
          setConfirmDelete(true);
        }}
        className={confirmDelete
          ? "p-1 rounded bg-destructive border border-destructive shadow-sm transition-colors"
          : "p-1 rounded bg-background border border-border shadow-sm hover:bg-destructive/10 transition-colors"
        }
        title={confirmDelete ? "Click again to confirm delete" : "Delete section"}
        aria-label={confirmDelete ? "Confirm delete section" : "Delete section"}
      >
        <Trash2 className={confirmDelete ? "h-3.5 w-3.5 text-destructive-foreground" : "h-3.5 w-3.5 text-muted-foreground"} />
      </button>
    </div>
  );
}
