import * as React from "react";
import {
  GripVertical,
  Eye,
  EyeOff,
  Pencil,
  LayoutGrid,
  Star,
  Newspaper,
  BookOpen,
  Wrench,
  Palette,
  Code,
  Calendar,
  Headphones,
  Sparkles,
  Flag,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { BlogSectionLayoutEditor } from "./BlogSectionLayoutEditor";

interface BlogSection {
  id: string;
  title: string;
  icon: LucideIcon;
  visible: boolean;
}

const defaultSections: BlogSection[] = [
  { id: "hero", title: "Hero Banner (Top)", icon: Star, visible: true },
  { id: "dispatches", title: "Dispatches From The Frontiers Of AI", icon: Newspaper, visible: true },
  { id: "essays", title: "Recent Essays", icon: BookOpen, visible: true },
  { id: "built-by-yangu", title: "Built By Yangu", icon: Wrench, visible: true },
  { id: "studio", title: "Yangu Studio", icon: Palette, visible: true },
  { id: "ai-at-work", title: "Putting AI At Work", icon: Sparkles, visible: true },
  { id: "programming", title: "Future Of Programming", icon: Code, visible: true },
  { id: "events", title: "Yangu Events", icon: Calendar, visible: true },
  { id: "podcast", title: "Yangu Podcast", icon: Headphones, visible: true },
  { id: "new-tools", title: "New Tools Category", icon: LayoutGrid, visible: true },
  { id: "finale", title: "Finale Hero Banner", icon: Flag, visible: true },
];

export function BlogOrganizeTab() {
  const [sections, setSections] = React.useState<BlogSection[]>(defaultSections);
  const [editingSection, setEditingSection] = React.useState<string | null>(null);
  const dragItem = React.useRef<number | null>(null);
  const dragOverItem = React.useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const updated = [...sections];
    const [removed] = updated.splice(dragItem.current, 1);
    updated.splice(dragOverItem.current, 0, removed);
    setSections(updated);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const toggleVisibility = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Layout Builder</h3>
          <p className="text-xs text-muted-foreground">Drag to reorder sections. Toggle visibility. Click edit for layout options.</p>
        </div>
        <Button size="sm" variant="outline" disabled>
          Save Layout
        </Button>
      </div>

      <div className="space-y-2">
        {sections.map((section, index) => (
          <div
            key={section.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors cursor-grab active:cursor-grabbing",
              !section.visible && "opacity-50"
            )}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <section.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium flex-1">{section.title}</span>
            <span className="text-xs text-muted-foreground tabular-nums">#{index + 1}</span>

            <Switch
              checked={section.visible}
              onCheckedChange={() => toggleVisibility(section.id)}
              className="scale-75"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {editingSection && (
        <BlogSectionLayoutEditor
          sectionId={editingSection}
          sectionTitle={sections.find((s) => s.id === editingSection)?.title ?? ""}
          onClose={() => setEditingSection(null)}
        />
      )}
    </div>
  );
}
