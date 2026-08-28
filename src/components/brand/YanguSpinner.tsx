// The single global Yangu loading identity: the Yangu "Y" mark in smooth rotation.
// Never substitute a sparkle, generic spinner wheel, robot or the glow ball.

import yanguY from "@/assets/yangu-y-loader.png";
import { cn } from "@/lib/utils";

export function YanguSpinner({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <img
      src={yanguY}
      alt=""
      aria-hidden
      width={size}
      height={size}
      draggable={false}
      className={cn("select-none object-contain", className)}
      style={{
        width: size,
        height: size,
        animation: "yangu-spin 1.4s linear infinite",
        filter: "drop-shadow(0 0 18px hsl(var(--yangu-green-hsl) / 0.35))",
      }}
    />
  );
}
