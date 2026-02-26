import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Loader2, Sparkles, ArrowLeftRight } from "lucide-react";
import { getContentSections, getGeneralSections } from "@/config/builderSectionPalettes";
import { BuilderAIGenerateModal } from "./BuilderAIGenerateModal";

interface BuilderAddSectionProps {
  onAdd: (sectionType: string) => Promise<void>;
  onAddWithSchema: (sectionType: string, schema: Record<string, unknown>) => Promise<void>;
  onSwitchMainContent?: (newType: string) => Promise<void>;
  isAdding: boolean;
  surfaceType: string;
  currentMainContentType?: string | null;
}

export function BuilderAddSection({
  onAdd,
  onAddWithSchema,
  onSwitchMainContent,
  isAdding,
  surfaceType,
  currentMainContentType,
}: BuilderAddSectionProps) {
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const contentSections = getContentSections(surfaceType);
  const generalSections = getGeneralSections();

  const handleSelectGeneral = async (type: string) => {
    setOpen(false);
    await onAdd(type);
  };

  const handleSwitchContent = async (type: string) => {
    setOpen(false);
    if (onSwitchMainContent) {
      await onSwitchMainContent(type);
    }
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
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-1">
              {/* Switch Content Type group */}
              {contentSections.length > 1 && onSwitchMainContent && (
                <>
                  <div className="px-3 py-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowLeftRight className="h-3 w-3" />
                      Switch Content Type
                    </p>
                  </div>
                  {contentSections.map(({ type, label, icon }) => {
                    const isCurrent = type === currentMainContentType;
                    return (
                      <button
                        key={type}
                        onClick={() => !isCurrent && handleSwitchContent(type)}
                        disabled={isCurrent}
                        className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors text-left ${
                          isCurrent
                            ? "bg-primary/10 text-primary font-medium cursor-default"
                            : "hover:bg-muted"
                        }`}
                      >
                        <span>{icon}</span>
                        <span className="flex-1">{label}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-primary/70">Current</span>
                        )}
                      </button>
                    );
                  })}
                  <div className="border-t border-border my-1.5" />
                </>
              )}

              {/* Add Section group */}
              <div className="px-3 py-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-3 w-3" />
                  Add Section
                </p>
              </div>
              {generalSections.map(({ type, label, icon }) => (
                <button
                  key={type}
                  onClick={() => handleSelectGeneral(type)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="sm" className="gap-2" onClick={() => setAiOpen(true)} disabled={isAdding}>
          <Sparkles className="h-4 w-4" />
          Ada AI
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
