import { getThemePreview, type ThemePreviewStyle } from "@/data/themePreviewStyles";

interface Props {
  themeKey: string;
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

/** Renders a rich CSS-based visual preview for a theme */
export function ThemePreviewCard({ themeKey, className = "", showText = true, size = "md" }: Props) {
  const preview = getThemePreview(themeKey);
  const sizeClasses = size === "sm" ? "h-16" : size === "lg" ? "h-48" : "h-28";

  return (
    <div
      className={`relative rounded-lg overflow-hidden ${sizeClasses} ${className}`}
      style={{ background: preview.gradient }}
    >
      {/* Pattern overlay */}
      <PatternOverlay pattern={preview.pattern} accent={preview.accent} />

      {/* Decorative icon */}
      <div className="absolute top-2 right-2 text-lg opacity-60" style={{ color: preview.accent }}>
        {preview.icon}
      </div>

      {/* Text content */}
      {showText && (
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <p
            className="text-xs font-extrabold tracking-wide leading-tight truncate"
            style={{ color: preview.accent }}
          >
            {preview.sampleText}
          </p>
          <p
            className="text-[9px] opacity-70 truncate"
            style={{ color: preview.secondary }}
          >
            {preview.sampleSub}
          </p>
        </div>
      )}

      {/* Accent bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ backgroundColor: preview.accent }}
      />
    </div>
  );
}

function PatternOverlay({ pattern, accent }: { pattern: ThemePreviewStyle["pattern"]; accent: string }) {
  const opacity = 0.08;
  const color = accent;

  switch (pattern) {
    case "circles":
      return (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-20 h-20 rounded-full border-2 -top-4 -right-4" style={{ borderColor: color, opacity }} />
          <div className="absolute w-12 h-12 rounded-full border-2 bottom-8 left-3" style={{ borderColor: color, opacity: opacity * 1.5 }} />
          <div className="absolute w-6 h-6 rounded-full top-6 left-1/2" style={{ backgroundColor: color, opacity }} />
        </div>
      );
    case "lines":
      return (
        <div className="absolute inset-0 overflow-hidden">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="absolute h-px w-full" style={{ top: `${18 + i * 18}%`, backgroundColor: color, opacity }} />
          ))}
        </div>
      );
    case "dots":
      return (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${10 + (i % 4) * 25}%`,
                top: `${15 + Math.floor(i / 4) * 30}%`,
                backgroundColor: color,
                opacity: opacity * 2,
              }}
            />
          ))}
        </div>
      );
    case "blocks":
      return (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-8 h-8 rounded top-3 right-8" style={{ backgroundColor: color, opacity }} />
          <div className="absolute w-5 h-12 rounded bottom-4 left-4" style={{ backgroundColor: color, opacity: opacity * 0.8 }} />
        </div>
      );
    case "wave":
      return (
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute bottom-0 left-0 w-full h-1/3" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path d="M0,20 Q25,5 50,15 T100,10 L100,30 L0,30 Z" fill={color} opacity={opacity} />
          </svg>
        </div>
      );
    case "diagonal":
      return (
        <div className="absolute inset-0 overflow-hidden">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="absolute h-px origin-center"
              style={{
                width: "141%",
                top: `${20 + i * 25}%`,
                left: "-20%",
                backgroundColor: color,
                opacity,
                transform: "rotate(-25deg)",
              }}
            />
          ))}
        </div>
      );
    case "grid":
      return (
        <div className="absolute inset-0 overflow-hidden">
          {[0, 1, 2].map(i => (
            <div key={`v${i}`} className="absolute w-px h-full" style={{ left: `${25 + i * 25}%`, backgroundColor: color, opacity }} />
          ))}
          {[0, 1, 2].map(i => (
            <div key={`h${i}`} className="absolute h-px w-full" style={{ top: `${25 + i * 25}%`, backgroundColor: color, opacity }} />
          ))}
        </div>
      );
    case "minimal":
    default:
      return null;
  }
}
