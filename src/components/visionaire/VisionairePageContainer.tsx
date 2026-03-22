import * as React from "react";
import { cn } from "@/lib/utils";

interface VisionairePageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * VisionairePageContainer - Consistent content wrapper for all Visionaire pages.
 * Matches YANGU dashboard content width, gutters, and prevents horizontal overflow.
 */
export function VisionairePageContainer({ children, className }: VisionairePageContainerProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[1200px] mx-auto px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6 pb-8 sm:pb-10 min-w-0 overflow-x-hidden min-h-screen",
        className
      )}
      style={{ background: "#08120D" }}
    >
      {children}
    </div>
  );
}
