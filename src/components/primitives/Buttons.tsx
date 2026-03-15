import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

/* ============================================
   Shared button base styles
   ============================================ */

const baseStyles =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0";

/* ============================================
   PrimaryButton
   ============================================ */

interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-9 px-4 text-[14px] rounded-[14px] [&_svg]:size-4",
  md: "h-10 px-5 text-[14px] rounded-[14px] [&_svg]:size-4",
  lg: "h-12 px-8 text-base rounded-[14px] [&_svg]:size-5",
};

/**
 * PrimaryButton - Main call-to-action button
 * Uses accent color with glow effect
 */
export const PrimaryButton = React.forwardRef<
  HTMLButtonElement,
  PrimaryButtonProps
>(({ className, size = "md", asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={cn(
        baseStyles,
        sizeClasses[size],
        "bg-accent text-accent-foreground shadow-md hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]",
        className
      )}
      {...props}
    />
  );
});
PrimaryButton.displayName = "PrimaryButton";

/* ============================================
   SecondaryButton
   ============================================ */

interface SecondaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost";
}

/**
 * SecondaryButton - Secondary action button
 * More subtle than PrimaryButton
 */
export const SecondaryButton = React.forwardRef<
  HTMLButtonElement,
  SecondaryButtonProps
>(({ className, size = "md", variant = "default", asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  const variantClasses = {
    default: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-border bg-transparent text-foreground hover:bg-muted",
    ghost: "bg-transparent text-foreground hover:bg-muted",
  };

  return (
    <Comp
      ref={ref}
      className={cn(
        baseStyles,
        sizeClasses[size],
        variantClasses[variant],
        "active:scale-[0.98]",
        className
      )}
      {...props}
    />
  );
});
SecondaryButton.displayName = "SecondaryButton";

/* ============================================
   IconButton
   ============================================ */

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost" | "accent";
  /** Accessible label (required for icon-only buttons) */
  "aria-label": string;
}

const iconSizeClasses = {
  sm: "h-8 w-8 rounded-lg [&_svg]:size-4",
  md: "h-10 w-10 rounded-lg [&_svg]:size-5",
  lg: "h-12 w-12 rounded-xl [&_svg]:size-6",
};

/**
 * IconButton - Square button for icon-only actions
 * Always requires aria-label for accessibility
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = "md", variant = "ghost", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const variantClasses = {
      default: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border border-border bg-transparent text-foreground hover:bg-muted",
      ghost: "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
      accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg",
    };

    return (
      <Comp
        ref={ref}
        className={cn(
          baseStyles,
          iconSizeClasses[size],
          variantClasses[variant],
          "active:scale-[0.95]",
          className
        )}
        {...props}
      />
    );
  }
);
IconButton.displayName = "IconButton";
