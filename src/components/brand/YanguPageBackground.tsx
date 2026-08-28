// Global Yangu page atmosphere: dark base with lower orange (left) and
// green (right) ambient light. Use this for any full-screen Yangu surface —
// auth, loading, system states, 404 — so every screen feels like one product.

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { YanguAmbientGlow } from "./YanguAmbientGlow";

export function YanguPageBackground({
  children,
  className,
  contentClassName,
}: {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className={cn("relative min-h-dvh overflow-hidden bg-background", className)}>
      <YanguAmbientGlow className="fixed h-[45vh]" />
      <YanguAmbientGlow variant="overlay" />
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </div>
  );
}

/** Centered global loading state: Yangu atmosphere + the Yangu spinner. No copy. */
export { YanguSpinner } from "./YanguSpinner";
