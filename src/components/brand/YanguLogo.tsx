import lockup from "@/assets/yangu-logo.png";
import mark from "@/assets/yangu-y-icon.png";

/** Official public marketing site — auth-page brand links point here. */
export const YANGU_SITE_URL = "https://yangu.io";

export const YANGU_LOGO_LOCKUP = lockup;
export const YANGU_LOGO_MARK = mark;

interface YanguLogoProps {
  /** "lockup" = mark + wordmark, "mark" = square icon only */
  variant?: "lockup" | "mark";
  /** Tailwind height class, e.g. "h-8". Width scales automatically. */
  className?: string;
  alt?: string;
}

/**
 * Single source of truth for the yangu brand logo.
 * Swap the asset imports above to update the logo platform-wide.
 */
export function YanguLogo({ variant = "lockup", className = "h-8", alt = "yangu" }: YanguLogoProps) {
  return (
    <img
      src={variant === "mark" ? mark : lockup}
      alt={alt}
      className={`w-auto object-contain ${className}`}
    />
  );
}
