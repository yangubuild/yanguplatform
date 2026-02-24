import { cn } from "@/lib/utils";

/**
 * Stable 2-column layout wrapper for AI Shorts.
 * LEFT = scrollable controls (fixed width), RIGHT = static preview (fills remaining).
 * This component locks the layout so future changes don't accidentally drift it.
 */
interface AiShortsLayoutShellProps {
  topBar: React.ReactNode;
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export function AiShortsLayoutShell({
  topBar,
  leftPanel,
  rightPanel,
}: AiShortsLayoutShellProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top bar — always visible, never scrolls */}
      <div className="shrink-0">{topBar}</div>

      {/* 2-column grid — fills remaining height */}
      <div
        className={cn(
          "flex-1 min-h-0",
          /* Desktop: fixed left + fluid right */
          "grid grid-cols-1 lg:grid-cols-[minmax(420px,480px)_1fr]",
          /* Tablet: slightly narrower left */
          "md:grid-cols-[minmax(360px,420px)_1fr]",
          "gap-0"
        )}
      >
        {/* LEFT — independently scrollable controls */}
        <div className="min-h-0 overflow-y-auto border-r border-border/20">
          {leftPanel}
        </div>

        {/* RIGHT — static preview, no scroll, vertically centered */}
        <div className="min-h-0 flex items-center justify-center overflow-hidden">
          {rightPanel}
        </div>
      </div>
    </div>
  );
}
