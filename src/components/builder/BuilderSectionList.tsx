import { useState, useRef, useCallback } from "react";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditorSection } from "@/hooks/useBuilderEditor";

interface BuilderSectionListProps {
  sections: EditorSection[];
  onReorder: (orderedIds: string[]) => void;
}

const TYPE_LABELS: Record<string, string> = {
  hero: "Hero",
  bio: "Bio",
  links: "Links",
  social: "Socials",
  cta: "CTA",
  video: "Video",
  gallery: "Gallery",
  text: "Text",
  products: "Products",
  services: "Services",
  testimonials: "Testimonials",
  contact: "Contact",
  faq: "FAQ",
  menu: "Menu",
  schedule: "Schedule",
};

export function BuilderSectionList({ sections, onReorder }: BuilderSectionListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

      onReorder(reordered.map((s) => s.id));
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
      {sections.map((section, index) => (
        <div
          key={section.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all cursor-grab active:cursor-grabbing",
            "bg-card border-border hover:border-muted-foreground/30",
            dragIndex === index && "opacity-40",
            overIndex === index && dragIndex !== index && "border-accent border-dashed"
          )}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="flex-1 text-sm font-medium truncate">
            {TYPE_LABELS[section.section_type] || section.section_type}
          </span>
          {!section.is_visible && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <EyeOff className="h-3 w-3" />
              Hidden
            </span>
          )}
          {section.is_visible && (
            <Eye className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
        </div>
      ))}
    </div>
  );
}
