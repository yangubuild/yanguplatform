import { getThemePreviewImage } from "@/data/themePreviewImages";

interface Props {
  themeKey: string;
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

/** Renders a real preview image for a theme, with graceful fallback */
export function ThemePreviewCard({ themeKey, className = "", showText = true, size = "md" }: Props) {
  const imageUrl = getThemePreviewImage(themeKey);
  const sizeClasses = size === "sm" ? "h-16" : size === "lg" ? "h-48" : "h-28";

  return (
    <div className={`relative rounded-lg overflow-hidden ${sizeClasses} ${className}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${themeKey} theme preview`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-muted/30 flex items-center justify-center">
          <span className="text-xs text-muted-foreground capitalize">{themeKey.replace(/-/g, " ")}</span>
        </div>
      )}
    </div>
  );
}
