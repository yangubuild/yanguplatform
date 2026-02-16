import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * PageShell — Temporary unified layout wrapper for spacing/padding standardisation.
 * Currently applied ONLY to /community and /ada-ai as a visual test.
 *
 * Desktop:  48px padding all sides
 * Tablet:   24px padding
 * Mobile:   16px padding
 *
 * Does NOT affect internal component spacing — outer padding only.
 */

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  /** Pass through a style object (e.g. background gradient) so the shell doesn't clip it */
  style?: React.CSSProperties;
}

export function PageShell({ children, className, style }: PageShellProps) {
  return (
    <div
      className={cn("min-h-screen", className)}
      style={style}
    >
      <div className="px-4 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-6 lg:px-12 lg:pt-12 lg:pb-12">
        {children}
      </div>
    </div>
  );
}

/* ── PageHeader ─────────────────────────────────────────────── */

interface PageHeaderProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageHeader — Sits inside PageShell. Provides consistent vertical gap
 * between title row and the content below (24px / mb-6).
 * Internal items are laid out with a 16px gap (gap-4).
 */
export function PageHeader({ children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center gap-4 mb-6", className)}>
      {children}
    </div>
  );
}

/* ── PageContent ────────────────────────────────────────────── */

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageContent — Main body area below PageHeader.
 * No extra spacing applied; acts as a semantic container.
 */
export function PageContent({ children, className }: PageContentProps) {
  return <div className={cn(className)}>{children}</div>;
}
