import yanguYGreen from "@/assets/yangu-y-loader.png";
import yanguYOrange from "@/assets/yangu-y-error.png";

interface YanguLoaderProps {
  /** Status text shown below the logo */
  statusText?: string;
  /** Optional progress percentage (0–100). Omit to show text only. */
  progress?: number;
  /** "loading" = Green Y (processing), "error" = Orange Y (attention needed) */
  state?: "loading" | "error";
  /** If true, fills the entire viewport instead of its parent */
  fullScreen?: boolean;
  className?: string;
}

/**
 * YanguLoader — LOCKED global loading / status component.
 *
 * 🟢 state="loading" → Green Y — AI working, page loading, processing
 * 🟠 state="error"   → Orange Y — failure, retry, attention required
 *
 * Animation style is identical for both states; only the logo image changes.
 * Do NOT create alternative loaders or status indicators.
 */
export function YanguLoader({
  statusText = "Loading…",
  progress,
  state = "loading",
  fullScreen = false,
  className,
}: YanguLoaderProps) {
  const logo = state === "error" ? yanguYOrange : yanguYGreen;
  const glowColor = state === "error" ? "bg-warning/20" : "bg-success/20";

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
            src={logo}
            alt={state === "error" ? "Attention needed" : "Loading"}
            className="h-full w-full object-contain animate-yangu-pulse"
          />
        </div>
        {/* Glow ring — green for loading, orange/amber for error */}
        <div className={`absolute inset-0 rounded-full ${glowColor} blur-xl animate-yangu-pulse`} />
      </div>

      {/* Status text */}
      <p className="text-sm text-muted-foreground font-medium">
        {statusText}
        {progress != null && ` (${Math.min(progress, 99)}%)`}
      </p>
    </div>
  );
}
