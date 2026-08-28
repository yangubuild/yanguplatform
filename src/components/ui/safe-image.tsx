import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Image with a neutral Yangu fallback.
 *
 * Never renders the browser's broken-image icon. When the source fails it
 * retries once (transient CDN/network failures) and then shows a muted
 * placeholder. Failed paths are logged in development so the real source
 * problem stays visible instead of being hidden by the placeholder.
 */
interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "onError"> {
  src?: string | null;
  alt: string;
  /** Optional element rendered instead of the default placeholder. */
  fallback?: React.ReactNode;
  /** Extra classes for the placeholder wrapper. */
  fallbackClassName?: string;
}

export function SafeImage({ src, alt, className, fallback, fallbackClassName, ...rest }: SafeImageProps) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setAttempt(0);
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    if (fallback) return <>{fallback}</>;
    return (
      <span
        role="img"
        aria-label={alt}
        className={cn(
          "inline-flex items-center justify-center rounded-lg bg-muted text-muted-foreground",
          className,
          fallbackClassName,
        )}
      >
        <ImageOff className="h-1/2 w-1/2 max-h-5 max-w-5 opacity-60" aria-hidden />
      </span>
    );
  }

  return (
    <img
      {...rest}
      src={attempt === 0 ? src : `${src}${src.includes("?") ? "&" : "?"}retry=${attempt}`}
      alt={alt}
      className={className}
      onError={() => {
        if (import.meta.env.DEV) console.warn("[SafeImage] failed to load:", src);
        if (attempt < 1) setAttempt(attempt + 1);
        else setFailed(true);
      }}
    />
  );
}

export default SafeImage;
