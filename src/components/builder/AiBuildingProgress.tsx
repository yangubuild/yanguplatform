/**
 * Brizy-style AI Building Progress — 4-step stepper with live preview skeleton.
 */

import { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "name", label: "SITE NAME", detail: "Setting up your name…" },
  { key: "industry", label: "INDUSTRY / NICHE", detail: "Analyzing your industry…" },
  { key: "info", label: "INFO", detail: "Crafting your content…" },
  { key: "building", label: "BUILDING", detail: "Generating pages & sections…" },
] as const;

const STEP_DURATIONS = [1800, 2200, 2800, 3500];

interface Props {
  engineLabel: string;
  isComplete: boolean;
  onAnimationDone: () => void;
}

export function AiBuildingProgress({ engineLabel, isComplete, onAnimationDone }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const doneCalledRef = useRef(false);

  useEffect(() => {
    if (isComplete) {
      setCurrentStep(STEPS.length);
      setProgress(100);
      if (!doneCalledRef.current) {
        doneCalledRef.current = true;
        const t = setTimeout(onAnimationDone, 900);
        return () => clearTimeout(t);
      }
      return;
    }

    if (currentStep >= STEPS.length) return;

    const targetPercent = ((currentStep + 1) / STEPS.length) * 85;
    const startPercent = (currentStep / STEPS.length) * 85;

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= targetPercent ? prev : prev + 0.4));
    }, 30);

    const timer = setTimeout(() => {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, STEP_DURATIONS[currentStep]);

    setProgress(startPercent);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [currentStep, isComplete, onAnimationDone]);

  const activeDetail = currentStep < STEPS.length
    ? STEPS[currentStep].detail
    : "Finalizing…";

  return (
    <div className="fixed inset-0 z-50 flex bg-background/95 backdrop-blur-sm">
      {/* Left: stepper + progress */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-sm w-full space-y-8">
          {/* Logo spinner */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="p-4 rounded-2xl bg-primary/10 animate-pulse">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              {!isComplete && (
                <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 text-primary animate-spin" />
              )}
            </div>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-foreground">Building your {engineLabel}</h2>
            <p className="text-sm text-muted-foreground">{activeDetail}</p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-1">
            {STEPS.map((step, idx) => {
              const isDone = idx < currentStep || isComplete;
              const isActive = idx === currentStep && !isComplete;
              return (
                <div key={step.key} className="flex items-center gap-1">
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all",
                    isDone && "bg-primary/10 text-primary",
                    isActive && "bg-primary text-primary-foreground",
                    !isDone && !isActive && "bg-muted text-muted-foreground"
                  )}>
                    {isDone ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : isActive ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : null}
                    {step.label}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={cn("w-4 h-px", isDone ? "bg-primary/30" : "bg-border")} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground tabular-nums">{Math.round(progress)}%</p>
          </div>
        </div>
      </div>

      {/* Right: preview skeleton */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-muted/30">
        <div className="w-[320px] rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          {/* Skeleton phone preview */}
          <div className="h-6 bg-muted/50 flex items-center justify-center">
            <div className="w-16 h-1.5 rounded-full bg-muted-foreground/20" />
          </div>
          <div className="p-4 space-y-4">
            {/* Hero skeleton */}
            <div className={cn(
              "h-32 rounded-lg transition-all duration-700",
              currentStep >= 0 ? "bg-primary/10 animate-pulse" : "bg-muted"
            )} />
            {/* Text block skeletons */}
            <div className="space-y-2">
              <div className={cn(
                "h-4 rounded w-3/4 transition-all duration-700",
                currentStep >= 1 ? "bg-primary/10 animate-pulse" : "bg-muted"
              )} />
              <div className={cn(
                "h-3 rounded w-full transition-all duration-700",
                currentStep >= 1 ? "bg-muted animate-pulse" : "bg-muted/50"
              )} />
              <div className={cn(
                "h-3 rounded w-5/6 transition-all duration-700",
                currentStep >= 1 ? "bg-muted animate-pulse" : "bg-muted/50"
              )} />
            </div>
            {/* Section blocks */}
            <div className={cn(
              "grid grid-cols-2 gap-2 transition-all duration-700",
              currentStep >= 2 ? "opacity-100" : "opacity-30"
            )}>
              {[1,2,3,4].map(i => (
                <div key={i} className={cn(
                  "h-16 rounded-lg transition-all duration-700",
                  currentStep >= 2 ? "bg-accent/50 animate-pulse" : "bg-muted/30"
                )} />
              ))}
            </div>
            {/* CTA skeleton */}
            <div className={cn(
              "h-10 rounded-lg transition-all duration-700",
              currentStep >= 3 ? "bg-primary/20 animate-pulse" : "bg-muted/30"
            )} />
          </div>
        </div>
      </div>
    </div>
  );
}
