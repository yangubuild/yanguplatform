import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import type { BuilderEngine, QuestionField } from "@/lib/builder/types";

interface Props {
  engine: BuilderEngine;
  onComplete: (answers: Record<string, unknown>) => Promise<unknown>;
  onBack: () => void;
}

/**
 * Generic multi-step wizard driven by engine config's manualSteps.
 * Replicates the existing EmenuWizard pattern but works for any category.
 */
export function BuilderManualWizard({ engine, onComplete, onBack }: Props) {
  const steps = engine.manualSteps;
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>(() => {
    // Initialize defaults from all fields
    const defaults: Record<string, unknown> = {};
    steps.forEach((step) =>
      step.fields.forEach((f) => {
        if (f.defaultValue !== undefined) defaults[f.key] = f.defaultValue;
        else if (f.type === "switch" || f.type === "checkbox") defaults[f.key] = false;
        else defaults[f.key] = "";
      })
    );
    return defaults;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;
  const isFirst = stepIdx === 0;

  const update = useCallback((key: string, value: unknown) => {
    setAnswers((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-derive slug from source field
      const currentFields = steps[stepIdx]?.fields || [];
      const slugField = currentFields.find((f) => f.type === "slug" && f.slugSource === key);
      if (slugField) {
        next[slugField.key] = String(value)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 40);
      }
      return next;
    });
  }, [steps, stepIdx]);

  // Populate industry options from engine config
  const getFieldOptions = useCallback((field: QuestionField) => {
    if (field.key === "industry" || field.key === "niche" || field.key === "community_type_industry") {
      // Use engine industries if field has no options
      if (!field.options || field.options.length === 0) {
        return engine.industries.map((i) => ({ value: i.value, label: i.label }));
      }
    }
    return field.options || [];
  }, [engine]);

  // Check if a field should be visible
  const isFieldVisible = useCallback((field: QuestionField) => {
    if (!field.showIf) return true;
    return !!answers[field.showIf];
  }, [answers]);

  // Check required fields for current step
  const canContinue = currentStep.fields
    .filter((f) => f.required && isFieldVisible(f))
    .every((f) => {
      const v = answers[f.key];
      return v !== undefined && v !== "" && v !== null;
    });

  const handleNext = async () => {
    if (isLast) {
      setIsSubmitting(true);
      try {
        await onComplete(answers);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  const renderField = (field: QuestionField) => {
    if (!isFieldVisible(field)) return null;
    const value = answers[field.key];

    switch (field.type) {
      case "text":
      case "email":
      case "tel":
        return (
          <div key={field.key} className={`space-y-1.5 ${field.colSpan === 1 ? "" : "col-span-2"}`}>
            <Label className="text-sm">{field.label}{field.required ? " *" : ""}</Label>
            <Input
              type={field.type}
              value={String(value || "")}
              onChange={(e) => update(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="h-9"
            />
            {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
          </div>
        );

      case "slug":
        return (
          <div key={field.key} className="space-y-1.5 col-span-2">
            <Label className="text-sm">{field.label}{field.required ? " *" : ""}</Label>
            <Input
              value={String(value || "")}
              onChange={(e) =>
                update(field.key, e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40))
              }
              placeholder={field.placeholder}
              className="h-9"
            />
            <p className="text-xs text-muted-foreground">
              Public link: {field.slugDomain}/{String(value || "…")}
            </p>
          </div>
        );

      case "textarea":
        return (
          <div key={field.key} className="space-y-1.5 col-span-2">
            <Label className="text-sm">{field.label}{field.required ? " *" : ""}</Label>
            <Textarea
              value={String(value || "")}
              onChange={(e) => update(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
            />
            {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
          </div>
        );

      case "select": {
        const options = getFieldOptions(field);
        return (
          <div key={field.key} className={`space-y-1.5 ${field.colSpan === 1 ? "" : "col-span-2"}`}>
            <Label className="text-sm">{field.label}{field.required ? " *" : ""}</Label>
            <Select value={String(value || "")} onValueChange={(v) => update(field.key, v)}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
          </div>
        );
      }

      case "color":
        return (
          <div key={field.key} className={`space-y-1.5 ${field.colSpan === 1 ? "" : "col-span-2"}`}>
            <Label className="text-sm">{field.label}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={String(value || "#000000")}
                onChange={(e) => update(field.key, e.target.value)}
                className="h-9 w-12 rounded border border-input cursor-pointer"
              />
              <Input
                value={String(value || "")}
                onChange={(e) => update(field.key, e.target.value)}
                className="w-28 font-mono text-sm h-9"
              />
            </div>
          </div>
        );

      case "switch":
        return (
          <div key={field.key} className={`flex items-center justify-between py-1 ${field.colSpan === 1 ? "" : "col-span-2"}`}>
            <div>
              <Label className="text-sm">{field.label}</Label>
              {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
            </div>
            <Switch checked={!!value} onCheckedChange={(v) => update(field.key, v)} />
          </div>
        );

      case "checkbox":
        return (
          <label key={field.key} className="flex items-center gap-3 cursor-pointer col-span-2">
            <Checkbox checked={!!value} onCheckedChange={(v) => update(field.key, !!v)} />
            <span className="text-sm">{field.label}</span>
          </label>
        );

      case "file":
        // File upload is rendered as a placeholder — the existing EmenuWizard
        // handles uploads with custom UI. For now, render a simple input.
        return (
          <div key={field.key} className="space-y-1.5 col-span-2">
            <Label className="text-sm">{field.label}</Label>
            <Input
              value={String(value || "")}
              onChange={(e) => update(field.key, e.target.value)}
              placeholder="Paste image URL or upload in editor"
              className="h-9"
            />
            {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-lg mx-auto py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{engine.label}</h1>
        <p className="text-muted-foreground mt-1">{engine.description}</p>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= stepIdx ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Step {stepIdx + 1} of {steps.length} — {currentStep.title}
          </h2>
          {currentStep.subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{currentStep.subtitle}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {currentStep.fields.map(renderField)}
        </div>

        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={isFirst ? onBack : () => setStepIdx((i) => i - 1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> {isFirst ? "Back" : "Previous"}
          </Button>
          <Button onClick={handleNext} disabled={!canContinue || isSubmitting} className="gap-2">
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
            ) : isLast ? (
              <><Sparkles className="h-4 w-4" /> {currentStep.continueLabel || "Complete"}</>
            ) : (
              <>{currentStep.continueLabel || "Continue"} <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
