import { useMemo } from "react";
import type { StepOption } from "./hooks/useStepController";
import { STYLE_PREVIEW_IMAGES } from "./utils/styleImages";
import { getTemplate } from "@/config/templateRegistry";

interface StyleCarouselProps {
  options: StepOption[];
  onSelect: (option: StepOption) => void;
}

/**
 * Build a CSS gradient preview thumbnail from an emenu template's hero colors.
 */
function buildEmenuPreviewGradient(templateKey: string): string | null {
  const preset = getTemplate("emenu", templateKey);
  if (!preset) return null;
  const heroSchema = preset.patches?.hero?.schema as Record<string, unknown> | undefined;
  if (!heroSchema) return null;
  const bgColor = (heroSchema.background_color as string) || "hsl(40 20% 8%)";
  const isDark = (heroSchema.background_style as string)?.includes("dark") || (heroSchema.text_color as string) === "light";
  const heroLayout = (heroSchema.layout_variant as string) || "split";
  // Create a distinct gradient based on template identity
  if (isDark) {
    return `linear-gradient(145deg, ${bgColor} 0%, hsl(40 15% 15%) 60%, hsl(35 20% 22%) 100%)`;
  }
  if (heroLayout === "split") {
    return `linear-gradient(135deg, ${bgColor} 0%, hsl(35 30% 90%) 100%)`;
  }
  return `linear-gradient(135deg, ${bgColor} 0%, hsl(200 20% 92%) 100%)`;
}

/**
 * Extract a summary of key sections from an emenu template for the preview card.
 */
function getEmenuSectionSummary(templateKey: string): string[] {
  const preset = getTemplate("emenu", templateKey);
  if (!preset?.reference?.sectionOrder) return [];
  return preset.reference.sectionOrder
    .filter(s => !s.startsWith("header") && !s.startsWith("footer"))
    .slice(0, 4)
    .map(s => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
}

export function StyleCarousel({ options, onSelect }: StyleCarouselProps) {
  // Check if these are emenu template options
  const isEmenuTemplates = useMemo(() =>
    options.length > 0 && options.some(o => o.value.startsWith("emenu_")),
  [options]);

  return (
    <div className="w-full max-w-[90%] overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 pb-2" style={{ minWidth: "max-content" }}>
        {options.map((opt) => {
          const previewSrc = STYLE_PREVIEW_IMAGES[opt.value];
          const emenuGradient = isEmenuTemplates ? buildEmenuPreviewGradient(opt.value) : null;
          const sectionTags = isEmenuTemplates ? getEmenuSectionSummary(opt.value) : [];
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-accent/10 transition-all w-[180px] shrink-0 group overflow-hidden"
            >
              {/* Image preview */}
              <div className="w-full h-[110px] overflow-hidden bg-muted">
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt={opt.label}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    width={180}
                    height={110}
                  />
                ) : emenuGradient ? (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center gap-1 p-2"
                    style={{ background: emenuGradient }}
                  >
                    <span className="text-xl">{opt.icon || "🍽️"}</span>
                    {sectionTags.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 justify-center">
                        {sectionTags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/20 text-white/80 font-medium truncate max-w-[70px]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                    <span className="text-2xl">{opt.icon || "🎯"}</span>
                  </div>
                )}
              </div>
              <div className="px-3 pb-3 pt-1 text-center">
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {opt.label}
                </span>
                {opt.description && (
                  <p className="text-[11px] text-muted-foreground leading-tight mt-1">
                    {opt.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
