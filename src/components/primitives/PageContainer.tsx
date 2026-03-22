import * as React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Max width variant */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Add vertical padding */
  padded?: boolean;
}

const sizeClasses = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

/**
 * PageContainer - Centered content container with consistent padding
 * Use this to wrap page content for consistent spacing
 */
export function PageContainer({
  children,
  className,
  size = "xl",
  padded = true,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        sizeClasses[size],
        padded && "py-6 lg:py-8",
        className
      )}>
      {children}
    </div>
  );
}
