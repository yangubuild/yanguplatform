import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { YanguLoader } from "@/components/YanguLoader";

export interface VariantPreviewItem {
  /** HTML string for iframe-based preview (internal templates) */
  html?: string;
  /** Static image URL for screenshot-based preview (reference templates) */
  imageUrl?: string;
  /** Display label */
  label: string;
}

interface VariantPreviewCarouselProps {
  variants: VariantPreviewItem[];
  onChoose: (index: number) => void;
  isGenerating: boolean;
}

export function VariantPreviewCarousel({ variants, onChoose, isGenerating }: VariantPreviewCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const canPrev = activeIndex > 0;
  const canNext = activeIndex < variants.length - 1;

  const goTo = (i: number) => {
    if (i >= 0 && i < variants.length) setActiveIndex(i);
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <YanguLoader size={48} fullArea={false} label="Generating your website variants..." />
        <p className="text-xs text-muted-foreground">Creating unique designs based on your selections</p>
      </div>
    );
  }

  if (variants.length === 0) return null;

  const current = variants[activeIndex];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary/60" />
          </div>
          <span className="text-xs text-muted-foreground">
            {current?.label || `Design ${activeIndex + 1}`} — {activeIndex + 1} of {variants.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {variants.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === activeIndex ? "bg-primary scale-125" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 relative overflow-hidden">
        {canPrev && (
          <button
            onClick={() => goTo(activeIndex - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
        )}
        {canNext && (
          <button
            onClick={() => goTo(activeIndex + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
        )}

        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {variants.map((item, i) => (
            <div key={i} className="w-full h-full shrink-0 flex items-center justify-center p-3">
              <div className="relative w-full h-full rounded-xl overflow-hidden border border-border shadow-xl bg-white">
                {item.imageUrl ? (
                  /* Screenshot-based preview for reference templates */
                  <div className="w-full h-full overflow-auto">
                    <img
                      src={item.imageUrl}
                      alt={item.label}
                      className="w-full h-auto object-cover object-top"
                      loading={i === 0 ? "eager" : "lazy"}
                    />
                  </div>
                ) : item.html ? (
                  /* HTML iframe preview for internal templates */
                  <iframe
                    srcDoc={item.html}
                    className="w-full h-full border-0"
                    title={item.label}
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : null}
                {/* Label overlay */}
                {item.imageUrl && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-background/80 backdrop-blur-sm border border-border text-xs font-medium text-foreground">
                    {item.label} — Reference Preview
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Choose CTA */}
      <div className="shrink-0 px-4 py-3 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Browse designs to compare</p>
        <button
          onClick={() => onChoose(activeIndex)}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Check className="h-4 w-4" />
          Choose this design
        </button>
      </div>
    </div>
  );
}
