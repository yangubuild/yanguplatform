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
    <div className="h-full flex flex-col overflow-hidden max-w-full">
      {/* Top bar – fixed height */}
      <div className="shrink-0 max-w-full overflow-hidden">{topBar}</div>

      {/* 2-column body — stacks on mobile */}
      <div
        className="ai-shorts-grid flex-1 min-h-0 grid gap-4 sm:gap-6 max-w-full overflow-x-hidden"
        style={{
          gridTemplateColumns: "minmax(0, 1fr)" }}>
        {/* On sm+ show 2-col layout via media query */}
        <style>{`
          @media (min-width: 900px) { .ai-shorts-grid { grid-template-columns: minmax(420px, 480px) 1fr !important; } }
        `}</style>

        {/* LEFT – scrollable */}
        <div className="min-h-0 overflow-y-auto max-w-full">{left}</div>

        {/* RIGHT – style grid (visible below on mobile, beside on desktop) */}
        <div className="min-h-0 overflow-y-auto sm:overflow-hidden sm:sticky sm:top-0 max-w-full">{right}</div>
      </div>
    </div>
  );
}
