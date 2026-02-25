import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Loader2 } from "lucide-react";
import { LIVE_BIO_SECTION_TYPES } from "@/hooks/useBuilderEditor";

interface BuilderAddSectionProps {
  onAdd: (sectionType: string) => Promise<void>;
  isAdding: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  hero: "🖼",
  bio: "📝",
  links: "🔗",
  social: "📱",
  cta: "📣",
  video: "🎬",
  gallery: "🖼️",
};

export function BuilderAddSection({ onAdd, isAdding }: BuilderAddSectionProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = async (type: string) => {
    setOpen(false);
    await onAdd(type);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          disabled={isAdding}
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add Section
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          {LIVE_BIO_SECTION_TYPES.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
            >
              <span>{TYPE_ICONS[type] || "📄"}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
