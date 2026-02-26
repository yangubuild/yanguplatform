import { useState, useRef, useCallback } from "react";
import { GripVertical, Eye, EyeOff, Trash2, Loader2, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { EditorSection } from "@/hooks/useBuilderEditor";
import { CORE_SECTIONS, resolveCoreSectionType, CONTENT_SECTION_TYPES } from "@/config/builderCoreSections";

interface BuilderSectionListProps {
  sections: EditorSection[];
  onReorder: (orderedIds: string[]) => void;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => Promise<boolean>;
  surfaceType?: string;
}

const TYPE_LABELS: Record<string, string> = {
  hero: "Hero Banner",
  header: "Header / Logo",
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
  offer: "Offers",
  hours: "Opening Hours",
  location: "Location",
  about: "About",
  plans: "Plans",
  featured: "Featured",
  join: "Join",
  listings: "Listings",
  footer: "Footer",
  // New content section types
  properties: "Properties",
  rooms: "Rooms",
  booking_calendar: "Booking",
  programs: "Programs",
  tours: "Tours",
  team: "Team",
  services_pricing: "Services & Pricing",
  featured_products: "Featured Products",
  deals: "Deals",
  flash_sale: "Flash Sale",
  reviews: "Reviews",
  supplier_catalog: "Supplier Catalog",
  bulk_products: "Bulk Products",
  agriculture_produce: "Agriculture",
  manufacturer_products: "Manufacturer",
  coaching: "Coaching",
  courses: "Courses",
  live_webinars: "Live Webinars",
  workshops: "Workshops",
  mentorship: "Mentorship",
  resources: "Resources",
  discussions: "Discussions",
  live_stream: "Live Stream",
  live_selling: "Live Selling",
  affiliate_products: "Affiliate Products",
  media_feed: "Media Feed",
  merch: "Merch",
  tips_support: "Tips & Support",
  collabs: "Collabs",
};

/** Get the wireframe-driven label for a section based on core definitions.
 *  Main content sections use their category-specific name directly (e.g. "Menu", "Products"). */
function getWireframeLabel(sectionType: string, surfaceType: string): string {
  for (const coreDef of CORE_SECTIONS) {
    const resolvedType = resolveCoreSectionType(coreDef.type, surfaceType);
    if (resolvedType === sectionType) {
      if (coreDef.type === "main_content") {
        // Use the specific label directly — "Menu", "Products", "Services", etc.
        return TYPE_LABELS[sectionType] || sectionType;
      }
      return coreDef.label;
    }
  }
  return TYPE_LABELS[sectionType] || sectionType;
}

export function BuilderSectionList({ sections, onReorder, selectedId, onSelect, onDelete, surfaceType = "quick_site" }: BuilderSectionListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
        const canDrag = !isMissing; // All real sections can be dragged for reorder
        const label = getWireframeLabel(section.section_type, surfaceType);

        return (
          <div
            key={section.id}
            draggable={canDrag}
            onDragStart={canDrag ? (e) => handleDragStart(e, index) : undefined}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => !isMissing && onSelect?.(section.id)}
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
            <span className={cn("flex-1 text-sm font-medium truncate", isMissing && "italic text-muted-foreground")}>
              {label}
              {isMissing && " (empty placeholder)"}
            </span>
            {isCore && !isMissing && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {CONTENT_SECTION_TYPES.has(section.section_type) ? "Core: Content" : "Core"}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">
                  {CONTENT_SECTION_TYPES.has(section.section_type)
                    ? "Switch the main content layout for your business"
                    : "Core sections can be hidden but not deleted"}
                </TooltipContent>
              </Tooltip>
            )}
            {!isMissing && !section.is_visible && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <EyeOff className="h-3 w-3" />
              </span>
            )}
            {!isMissing && section.is_visible && (
              <Eye className="h-3.5 w-3.5 text-muted-foreground/50" />
            )}
            {/* Delete button — only for non-core sections */}
            {!isCore && !isMissing && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirm(`Delete "${label}" section?`)) return;
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
      })}
    </div>
  );
}
