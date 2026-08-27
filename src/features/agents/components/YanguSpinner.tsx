// The platform's original green Yangu "Y" spinner — the ONLY loading symbol
// used inside AI Agents (composer thinking, agent loading, voice sync,
// call creation, deployment, campaign preparation).

import yanguY from "@/assets/yangu-y-loader.png";
import { cn } from "@/lib/utils";

export function YanguSpinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <img
      src={yanguY}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={cn("animate-spin object-contain", className)}
      style={{ width: size, height: size, animationDuration: "1.4s", animationTimingFunction: "linear" }}
    />
  );
}

/** Inline "doing something" row with the green Y. */
export function YanguWorking({ label, size = 16, className }: { label: string; size?: number; className?: string }) {
  return (
    <p className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)} role="status">
      <YanguSpinner size={size} />
      {label}
    </p>
  );
}
