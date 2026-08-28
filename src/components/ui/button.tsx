import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[14px] font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Global Yangu primary CTA — dark interior, thin green→orange gradient
        // border, subtle glow. Matches yangu.io. Used by every primary action.
        default:
          "yangu-border-gradient bg-[#0A0F0C] text-foreground rounded-lg shadow-[0_6px_24px_-10px_hsl(25_100%_50%/0.35)] hover:bg-[#0E1512] hover:shadow-[0_8px_30px_-8px_hsl(25_100%_50%/0.45)] active:bg-[#080C0A] disabled:shadow-none",

        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg",
        outline: "border border-input bg-transparent text-foreground hover:bg-muted rounded-lg",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground rounded-lg",
        link: "text-primary underline-offset-4 hover:underline",
        // yangu primary CTA — same shared gradient-border + glow as `default`
        // so every primary action across the platform looks identical.
        accent:
          "yangu-border-gradient bg-[#0A0F0C] text-foreground rounded-lg transition-all shadow-[0_6px_24px_-10px_hsl(25_100%_50%/0.35)] hover:bg-[#0E1512] hover:shadow-[0_8px_30px_-8px_hsl(25_100%_50%/0.45)] active:bg-[#080C0A] disabled:shadow-none",

        // yangu solid green button
        solid: "text-foreground border-0 rounded-lg transition-all hover:brightness-110 [background:#152A20]",
        // yangu transparent dark green
        "dark-green": "text-muted-foreground bg-transparent border border-[#152A20]/40 rounded-lg hover:bg-[#152A20]/20 transition-all",
        // yangu light orange tint
        "accent-light": "text-accent bg-accent/10 border border-accent/20 rounded-lg hover:bg-accent/15 transition-all",
        // yangu light green tint
        "solid-light": "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/15 transition-all",
        success: "bg-success text-success-foreground hover:bg-success/90 rounded-lg",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
