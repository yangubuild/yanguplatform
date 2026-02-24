import { type ReactNode } from "react";

interface Props {
  topBar: ReactNode;
  left: ReactNode;
  right: ReactNode;
}

/**
 * Locked 2-column layout for AI Shorts.
 * Left panel scrolls independently; right panel stays static.
 * Isolated from shared tool wrappers to prevent layout drift.
 */
export default function AiShortsLayoutShell({ topBar, left, right }: Props) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top bar – fixed height */}
      <div className="shrink-0">{topBar}</div>

      {/* 2-column body */}
      <div
        className="flex-1 min-h-0 grid gap-6"
        style={{
          gridTemplateColumns: "minmax(420px, 480px) 1fr",
        }}
      >
        {/* LEFT – scrollable */}
        <div className="min-h-0 overflow-y-auto">{left}</div>

        {/* RIGHT – static preview */}
        <div className="min-h-0 overflow-hidden sticky top-0">{right}</div>
      </div>
    </div>
  );
}
