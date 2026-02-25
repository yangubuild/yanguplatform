import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { LIVE_BIO_SECTION_TYPES } from "@/hooks/useBuilderEditor";
import { BuilderAIGenerateModal } from "./BuilderAIGenerateModal";

interface BuilderAddSectionProps {
  onAdd: (sectionType: string) => Promise<void>;
  onAddWithSchema: (sectionType: string, schema: Record<string, unknown>) => Promise<void>;
  isAdding: boolean;
  surfaceType: string;
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

export function BuilderAddSection({ onAdd, onAddWithSchema, isAdding, surfaceType }: BuilderAddSectionProps) {
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const handleSelect = async (type: string) => {
    setOpen(false);
    await onAdd(type);
  };

  return (
    <>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 gap-2" disabled={isAdding}>
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
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

        <Button variant="outline" size="sm" className="gap-2" onClick={() => setAiOpen(true)} disabled={isAdding}>
          <Sparkles className="h-4 w-4" />
          AI
        </Button>
      </div>

      <BuilderAIGenerateModal
        open={aiOpen}
        onOpenChange={setAiOpen}
        surfaceType={surfaceType}
        onGenerated={onAddWithSchema}
      />
    </>
  );
}
