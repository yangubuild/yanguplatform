import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { IconButton } from "./Buttons";

interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: "default" | "info" | "success" | "warning" | "danger";
  /** Show dismiss button */
  dismissible?: boolean;
  /** Called when dismiss button clicked */
  onDismiss?: () => void;
  /** Optional icon */
  icon?: React.ReactNode;
}

const variantClasses = {
  default: "bg-muted text-muted-foreground",
  info: "bg-yangu-blue/10 text-yangu-blue border-yangu-blue/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
};

/**
 * Banner - Prominent message container with 24px border radius
 * Use for announcements, alerts, promotional content
 */
export const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  (
    {
      className,
      variant = "default",
      dismissible = false,
      onDismiss,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative flex items-center gap-3 rounded-2xl border px-5 py-4", // 24px radius = rounded-2xl
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <div className="flex-1 text-sm font-medium">{children}</div>
        {dismissible && onDismiss && (
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="flex-shrink-0 -mr-2"
          >
            <X className="h-4 w-4" />
          </IconButton>
        )}
      </div>
    );
  }
);
Banner.displayName = "Banner";
