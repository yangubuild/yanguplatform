import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { getContentSections } from "@/config/builderSectionPalettes";
import { cn } from "@/lib/utils";

interface MainContentSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitch: (newType: string) => Promise<string | null | void>;
  surfaceType: string;
  currentMainContentType?: string | null;
  className?: string;
}

export function MainContentSwitcher({
  open,
  onOpenChange,
  onSwitch,
  surfaceType,
  currentMainContentType,
  className,
}: MainContentSwitcherProps) {
  const [switchingType, setSwitchingType] = useState<string | null>(null);
  const contentSections = getContentSections(surfaceType);

  const handleSelect = async (type: string) => {
    if (type === currentMainContentType || switchingType) return;
    onOpenChange(false);
    setSwitchingType(type);
    try {
      await onSwitch(type);
    } finally {
      setSwitchingType(null);
    }
  };

  if (contentSections.length <= 1) return null;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "h-6 w-6 shrink-0 rounded-md inline-flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors",
            className
          )}
          aria-label="Switch main content type"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start" side="right">
        <div className="px-3 py-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ArrowLeftRight className="h-3 w-3" />
            Switch Content Type
          </p>
        </div>
        <div className="space-y-0.5">
          {contentSections.map(({ type, label, icon }) => {
            const isCurrent = type === currentMainContentType;
            const isSwitching = switchingType === type;
            return (
              <button
                key={type}
                onClick={() => !isCurrent && handleSelect(type)}
                disabled={isCurrent || !!switchingType}
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
                {isSwitching && <Loader2 className="h-3 w-3 animate-spin" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
