// Global lower ambient light from yangu.io: orange bottom-left, green
// bottom-right, dark blended centre. Purely decorative.

import { cn } from "@/lib/utils";

export function YanguAmbientGlow({ className }: { className?: string }) {
  return <div aria-hidden className={cn("yangu-ambient", className)} />;
}
