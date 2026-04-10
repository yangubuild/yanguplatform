import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Loader2, Sparkles, LayoutTemplate } from "lucide-react";
import { getGeneralSections } from "@/config/builderSectionPalettes";
import { BuilderAIGenerateModal } from "./BuilderAIGenerateModal";

interface BuilderAddSectionProps {
  onAdd: (sectionType: string) => Promise<void>;
  onAddWithSchema: (sectionType: string, schema: Record<string, unknown>) => Promise<void>;
  isAdding: boolean;
  surfaceType: string;
  /** When provided, only these section types appear in the "Add Section" popover */
  allowedSectionTypes?: string[];
}

export function BuilderAddSection({
  onAdd,
  onAddWithSchema,
  isAdding,
  surfaceType,
  allowedSectionTypes,
}: BuilderAddSectionProps) {
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [designedOpen, setDesignedOpen] = useState(false);

  const allSections = getGeneralSections();
  const generalSections = allowedSectionTypes
    ? allSections.filter((s) => allowedSectionTypes.includes(s.type))
    : allSections;

  const handleSelectGeneral = async (type: string) => {
    setDesignedOpen(false);
    setOpen(false);
    await onAdd(type);
  };

  return (
    <>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 gap-2" disabled={isAdding} data-add-section-trigger>
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Section
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-1">
              <button
                onClick={() => { setOpen(false); setAiOpen(true); }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-md hover:bg-muted transition-colors text-left">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <span className="font-medium">Generate with AI</span>
                  <p className="text-[11px] text-muted-foreground">Let Ada create a section for you</p>
                </div>
              </button>
              <Popover open={designedOpen} onOpenChange={setDesignedOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-md hover:bg-muted transition-colors text-left">
                    <LayoutTemplate className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="font-medium">Designed Section</span>
                      <p className="text-[11px] text-muted-foreground">Pick from pre-built sections</p>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" side="right" align="start">
                  <div className="space-y-0.5">
                    {generalSections.map(({ type, label, icon }) => (
                      <button
                        key={type}
                        onClick={() => handleSelectGeneral(type)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left">
                        <span>{icon}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </PopoverContent>
        </Popover>
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
