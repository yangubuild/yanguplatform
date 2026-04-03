import { useMemo } from "react";
import type { StepOption } from "./hooks/useStepController";
import { STYLE_PREVIEW_IMAGES } from "./utils/styleImages";

interface StyleCarouselProps {
  options: StepOption[];
  onSelect: (option: StepOption) => void;
}

export function StyleCarousel({ options, onSelect }: StyleCarouselProps) {
  return (
    <div className="w-full max-w-[90%] overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 pb-2" style={{ minWidth: "max-content" }}>
        {options.map((opt) => {
          const previewSrc = STYLE_PREVIEW_IMAGES[opt.value];
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
