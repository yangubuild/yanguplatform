import { useState, useMemo } from "react";
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
      <div className="flex flex-col gap-2 w-full max-w-[90%]">
        {config.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt)}
            className="flex flex-col gap-1 p-4 rounded-2xl border border-border bg-card hover:bg-accent/10 hover:border-primary/40 transition-all text-left group"
          >
            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {opt.label}
            </span>
            {opt.description && (
              <span className="text-xs text-muted-foreground">{opt.description}</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Chips (default) — for multi-select
  return (
    <div className="flex flex-col gap-3 w-full max-w-[90%]">
      <div className="flex flex-wrap gap-2">
        {config.options.map((opt) => {
          const isSelected = multiSelected.includes(opt.value);
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-full border transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {isSelected && <Check className="h-3.5 w-3.5" />}
              {opt.label}
            </button>
          );
        })}
      </div>
      {config.multiSelect && (
        <button
          onClick={onConfirmMulti}
          disabled={multiSelected.length === 0}
          className="self-start px-6 py-2.5 text-sm font-semibold rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Done ✓
        </button>
      )}
    </div>
  );
}
