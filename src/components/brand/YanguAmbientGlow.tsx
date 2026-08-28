// Global lower ambient light from yangu.io: orange bottom-left, green
// bottom-right, dark blended centre. Purely decorative.

import { cn } from "@/lib/utils";

interface YanguAmbientGlowProps {
  className?: string;
  /**
   * "behind" (default) sits behind content — use inside shells whose content
   * is transparent. "overlay" screen-blends above opaque page backgrounds so
   * the ambient light still reads on screens that paint their own background.
   */
  variant?: "behind" | "overlay";
}

export function YanguAmbientGlow({ className, variant = "behind" }: YanguAmbientGlowProps) {
  return (
    <div
      aria-hidden
      className={cn(variant === "overlay" ? "yangu-ambient-overlay" : "yangu-ambient", className)}
    />
  );
}
