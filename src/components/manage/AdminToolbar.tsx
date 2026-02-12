import * as React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Slot rendered on the left (tabs, filters, etc.) */
  left?: React.ReactNode;
  /** Slot rendered on the right (primary action button, etc.) */
  right?: React.ReactNode;
  /** Show a filter button (stubbed) */
  showFilter?: boolean;
  className?: string;
}

export function AdminToolbar({
  search = "",
  onSearchChange,
  searchPlaceholder = "Search…",
  left,
  right,
  showFilter = false,
  className,
}: AdminToolbarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {left && <div className="flex items-center gap-2">{left}</div>}

      <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9 h-9"
        />
      </div>

      {showFilter && (
        <Button variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter
        </Button>
      )}

      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
