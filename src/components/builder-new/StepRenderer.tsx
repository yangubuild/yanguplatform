import type { StepConfig, StepOption, BuilderStep } from "./hooks/useStepController";
import { StyleCarousel } from "./StyleCarousel";
import { Check } from "lucide-react";

interface StepRendererProps {
  config: StepConfig;
  onSelect: (option: StepOption) => void;
  onConfirmMulti?: () => void;
  multiSelected?: string[];
  currentStep: BuilderStep;
}

export function StepRenderer({ config, onSelect, onConfirmMulti, multiSelected = [], currentStep }: StepRendererProps) {
  if (config.options.length === 0) return null;

  if (config.renderAs === "carousel") {
    return (
      <StyleCarousel
        options={config.options}
        onSelect={onSelect}
      />
    );
  }

  if (config.renderAs === "cards") {
    return (
      <div className="flex flex-col gap-1.5 w-full max-w-[88%]">
        {config.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt)}
            className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-accent/10 hover:border-primary/40 transition-all text-left group"
          >
            <span className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
              {opt.label}
            </span>
            {opt.description && (
              <span className="text-[11px] text-muted-foreground leading-tight">{opt.description}</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Chips (default) — for multi-select
  return (
    <div className="flex flex-col gap-2 w-full max-w-[88%]">
      <div className="flex flex-wrap gap-1.5">
        {config.options.map((opt) => {
          const isSelected = multiSelected.includes(opt.value);
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-[12px] rounded-full border transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {opt.label}
            </button>
          );
        })}
      </div>
      {config.multiSelect && (
        <button
          onClick={onConfirmMulti}
          disabled={multiSelected.length === 0}
          className="self-start px-5 py-2 text-[12px] font-semibold rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Done ✓
        </button>
      )}
    </div>
  );
}
