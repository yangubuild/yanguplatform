import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeftRight } from "lucide-react";
import { getContentSections } from "@/config/builderSectionPalettes";

interface MainContentSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitch: (newType: string) => Promise<void>;
  surfaceType: string;
  currentMainContentType?: string | null;
  children: React.ReactNode;
}

export function MainContentSwitcher({
  open,
  onOpenChange,
  onSwitch,
  surfaceType,
  currentMainContentType,
  children,
}: MainContentSwitcherProps) {
  const contentSections = getContentSections(surfaceType);

  const handleSelect = async (type: string) => {
    onOpenChange(false);
    await onSwitch(type);
  };

  if (contentSections.length <= 1) return <>{children}</>;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
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
            return (
              <button
                key={type}
                onClick={() => !isCurrent && handleSelect(type)}
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
