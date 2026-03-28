import type { StepOption } from "./hooks/useStepController";

interface StyleCarouselProps {
  options: StepOption[];
  onSelect: (option: StepOption) => void;
}

export function StyleCarousel({ options, onSelect }: StyleCarouselProps) {
  return (
    <div className="w-full max-w-[90%] overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 pb-2" style={{ minWidth: "max-content" }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-accent/10 transition-all w-[160px] shrink-0 group"
          >
            {/* Color swatch preview */}
            <div className="w-full h-20 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-2xl">{getStyleEmoji(opt.value)}</span>
            </div>
            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors text-center">
              {opt.label}
            </span>
            {opt.description && (
              <span className="text-[11px] text-muted-foreground text-center leading-tight">
                {opt.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function getStyleEmoji(value: string): string {
  const map: Record<string, string> = {
    bold: "🔥",
    warm: "☕",
    clean: "✨",
    premium: "💎",
    playful: "🎉",
    vibrant_pop: "🎨",
    neon_glow: "💡",
    street_bold: "🏙️",
    rustic_wood: "🪵",
    golden_hour: "🌅",
    heritage: "🏛️",
    swiss_minimal: "🇨🇭",
    soft_pastel: "🌸",
    mono_sharp: "⬛",
    dark_gold: "🥇",
    marble_lux: "🏛️",
    noir_class: "🖤",
    tropical_burst: "🌴",
    candy_pop: "🍬",
    retro_fun: "📼",
  };
  return map[value] || "🎯";
}
