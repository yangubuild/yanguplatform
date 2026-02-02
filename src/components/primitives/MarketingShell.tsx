import * as React from "react";
import { cn } from "@/lib/utils";

interface MarketingShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * MarketingShell - Layout for public/marketing pages (no sidebar)
 * Use this for landing pages, pricing, about, etc.
 */
export function MarketingShell({ children, header, footer, className }: MarketingShellProps) {
  return (
    <div className={cn("min-h-screen flex flex-col bg-background", className)}>
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  );
}
