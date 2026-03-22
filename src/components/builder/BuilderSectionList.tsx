import { useState, useRef, useCallback } from "react";
import { GripVertical, Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { EditorSection } from "@/hooks/useBuilderEditor";
import { CORE_SECTIONS, resolveCoreSectionType, CONTENT_SECTION_TYPES } from "@/config/builderCoreSections";
import { SECTION_TYPE_LABELS } from "@/config/builderSectionLabels";
import { MainContentSwitcher } from "./MainContentSwitcher";

/** Detect if a section is the main_content slot */
function isMainContentSlot(section: EditorSection, surfaceType: string): boolean {
  if (section.core_slot === "main_content") return true;
  // Fallback: check if it's a core section whose type is in CONTENT_SECTION_TYPES
  if (section.isCore && CONTENT_SECTION_TYPES.has(section.section_type)) return true;
  return false;
}

/** Get display label for a section */
function getSectionLabel(section: EditorSection, surfaceType: string): { primary: string; secondary?: string } {
  if (isMainContentSlot(section, surfaceType)) {
    const typeLabel = TYPE_LABELS[section.section_type] || section.section_type;
    return { primary: "Main Content", secondary: `Currently: ${typeLabel}` };
  }

  // Other core sections use their wireframe label
  for (const coreDef of CORE_SECTIONS) {
    const resolvedType = resolveCoreSectionType(coreDef.type, surfaceType);
    if (resolvedType === section.section_type && coreDef.type !== "main_content") {
      return { primary: coreDef.label };
    }
  }

  return { primary: TYPE_LABELS[section.section_type] || section.section_type };
}

export function BuilderSectionList({ sections, onReorder, selectedId, onSelect, onDelete, onSwitchMainContent, onVariantChange, surfaceType = "quick_site", currentMainContentType, industry }: BuilderSectionListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [switcherOpenForId, setSwitcherOpenForId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ... keep existing code (drag handlers)

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === dropIndex) {
        setDragIndex(null);
        setOverIndex(null);
        return;
      }

      const reordered = [...sections];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(dropIndex, 0, moved);

      onReorder(reordered.filter((s) => !s.isMissing).map((s) => s.id));
      setDragIndex(null);
      setOverIndex(null);
    },
    [dragIndex, sections, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  if (sections.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No sections yet. Add one to get started.
      </div>
    );
  }

  return (
    <div ref={listRef} className="space-y-1">
      {sections.map((section, index) => {
        const isCore = !!section.isCore;
        const isMissing = !!section.isMissing;
        const canDrag = !isMissing;
        const isMainContent = isMainContentSlot(section, surfaceType);
        const { primary, secondary } = getSectionLabel(section, surfaceType);

        const rowContent = (
          <div
            key={section.id}
            draggable={canDrag}
            onDragStart={canDrag ? (e) => handleDragStart(e, index) : undefined}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => {
              if (isMissing) return;
              onSelect?.(section.id);
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all",
              isMissing
                ? "bg-muted/30 border-dashed border-border/50 opacity-50 cursor-default"
                : "bg-card border-border hover:border-muted-foreground/30 cursor-pointer",
              canDrag && !isMissing && "cursor-grab active:cursor-grabbing",
              selectedId === section.id && !isMissing && "ring-2 ring-primary border-primary",
              dragIndex === index && "opacity-40",
              overIndex === index && dragIndex !== index && "border-accent border-dashed"
            )}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className={cn("flex-1 min-w-0", isMissing && "italic text-muted-foreground")}>
              <span className="text-sm font-medium truncate block">
                {primary}
                {isMissing && " (empty placeholder)"}
              </span>
              {secondary && !isMissing && (
                <span className="text-[11px] text-muted-foreground truncate block">{secondary}</span>
              )}
            </div>
            {/* Starter badge */}
            {isCore && !isMissing && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                    Starter
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">
                  {isMainContent
                    ? "Default starter section — movable, deletable, and swappable"
                    : "Default starter section — movable and deletable"}
                </TooltipContent>
              </Tooltip>
            )}
            {/* Switch control — only for main_content */}
            {isMainContent && !isMissing && onSwitchMainContent && (
              <MainContentSwitcher
                open={switcherOpenForId === section.id}
                onOpenChange={(open) => setSwitcherOpenForId(open ? section.id : null)}
                onSwitch={async (newType) => {
                  const newSectionId = await onSwitchMainContent(newType);
                  setSwitcherOpenForId(null);
                  if (newSectionId) {
                    onSelect?.(newSectionId);
                  }
                  return newSectionId;
                }}
                onVariantChange={onVariantChange ? (mode) => onVariantChange(section.id, mode) : undefined}
                surfaceType={surfaceType}
                currentMainContentType={currentMainContentType}
                currentDisplayMode={(section.schema?.display_mode as string) || null}
              />
            )}
            {/* Visibility icons */}
            {!isMissing && !section.is_visible && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <EyeOff className="h-3 w-3" />
              </span>
            )}
            {!isMissing && section.is_visible && (
              <Eye className="h-3.5 w-3.5 text-muted-foreground/50" />
            )}
            {/* Delete button — available for every persisted section */}
            {!isMissing && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirm(`Delete "${primary}" section?`)) return;
                  setDeletingId(section.id);
                  await onDelete(section.id);
                  setDeletingId(null);
                }}
                disabled={deletingId === section.id}
              >
                {deletingId === section.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        );

        return rowContent;
      })}
    </div>
  );
}