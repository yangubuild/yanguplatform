import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current value to display */
  value: string | number;
  /** Trend direction */
  trend?: "up" | "down" | "neutral";
  /** Percentage or delta change */
  change?: string | number;
  /** Label for the metric */
  label?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: {
    container: "gap-2 px-3 py-2",
    value: "text-lg font-semibold",
    change: "text-xs",
    label: "text-xs",
  },
  md: {
    container: "gap-3 px-4 py-3",
    value: "text-2xl font-bold",
    change: "text-sm",
    label: "text-sm",
  },
  lg: {
    container: "gap-4 px-5 py-4",
    value: "text-3xl font-bold",
    change: "text-base",
    label: "text-base",
  },
};

const trendColors = {
  up: "text-success",
  down: "text-danger",
  neutral: "text-muted-foreground",
};

const TrendIcon = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

/**
 * TrendBar - Display a metric with trend indicator
 * Use for KPIs, analytics, stats display
 */
export const TrendBar = React.forwardRef<HTMLDivElement, TrendBarProps>(
  (
    {
      className,
      value,
      trend = "neutral",
      change,
      label,
      size = "md",
      ...props
    },
    ref
  ) => {
    const Icon = TrendIcon[trend];
    const styles = sizeClasses[size];

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center rounded-xl bg-surface border border-border",
          styles.container,
          className
        )}
        {...props}
      >
        {/* Value */}
        <span className={cn("text-foreground", styles.value)}>{value}</span>

        {/* Trend indicator */}
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1",
              trendColors[trend],
              styles.change
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="font-medium">
              {trend === "up" && "+"}
              {change}
              {typeof change === "number" && "%"}
            </span>
          </div>
        )}

        {/* Label */}
        {label && (
          <span className={cn("text-muted-foreground ml-auto", styles.label)}>
            {label}
          </span>
        )}
      </div>
    );
  }
);
TrendBar.displayName = "TrendBar";

/**
 * TrendBarCompact - Inline trend indicator without container
 * Use within cards or tables
 */
interface TrendBarCompactProps {
  trend: "up" | "down" | "neutral";
  change: string | number;
  className?: string;
}

export function TrendBarCompact({
  trend,
  change,
  className,
}: TrendBarCompactProps) {
  const Icon = TrendIcon[trend];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium",
        trendColors[trend],
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>
        {trend === "up" && "+"}
        {change}
        {typeof change === "number" && "%"}
      </span>
    </span>
  );
}
