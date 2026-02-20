import yanguY from "@/assets/yangu-y-loader.png";

interface YanguLoaderProps {
  /** Status text shown below the logo */
  statusText?: string;
  /** Optional progress percentage (0–100). Omit to show text only. */
  progress?: number;
  /** If true, fills the entire viewport instead of its parent */
  fullScreen?: boolean;
  className?: string;
}

/**
 * YanguLoader — LOCKED global loading component.
 * All loading / processing / transition states across the YANGU platform
 * must use this component exclusively. Do NOT create alternative loaders.
 */
export function YanguLoader({
  statusText = "Loading…",
  progress,
  fullScreen = false,
  className,
}: YanguLoaderProps) {
  return (
    <div
      className={`${
        fullScreen ? "fixed" : "absolute"
      } inset-0 z-50 flex flex-col items-center justify-center bg-background ${className ?? ""}`}
    >
      {/* Animated Y logo with glow */}
      <div className="relative mb-8">
        <div className="h-20 w-20 animate-yangu-spin">
          <img
            src={yanguY}
            alt="Loading"
            className="h-full w-full object-contain animate-yangu-pulse"
          />
        </div>
        {/* Green glow ring */}
        <div className="absolute inset-0 rounded-full bg-success/20 blur-xl animate-yangu-pulse" />
      </div>

      {/* Status text */}
      <p className="text-sm text-muted-foreground font-medium">
        {statusText}
        {progress != null && ` (${Math.min(progress, 99)}%)`}
      </p>
    </div>
  );
}
