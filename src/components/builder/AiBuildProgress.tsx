/**
 * AI Build Progress Screen — Premium full-screen overlay
 * shown during AI-assisted surface generation.
 */

import { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "name", label: "Setting up your name", duration: 1500 },
  { key: "industry", label: "Analyzing your industry", duration: 2000 },
  { key: "brand", label: "Crafting your brand", duration: 2500 },
  { key: "pages", label: "Building pages & sections", duration: 3000 },
  { key: "images", label: "Selecting images", duration: 2000 },
  { key: "finalize", label: "Finalizing your site", duration: 1500 },
] as const;

interface Props {
  engineLabel: string;
  /** Call this when the actual AI work is done; progress will animate to 100% */
  isComplete: boolean;
  /** Called after completion animation finishes */
  onAnimationDone: () => void;
}

export function AiBuildProgress({ engineLabel, isComplete, onAnimationDone }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const doneCalledRef = useRef(false);

  // Animate through steps
  useEffect(() => {
    if (isComplete) {
      setCurrentStep(STEPS.length);
      setProgress(100);
      if (!doneCalledRef.current) {
        doneCalledRef.current = true;
        const timer = setTimeout(onAnimationDone, 800);
        return () => clearTimeout(timer);
      }
      return;
    }

    if (currentStep >= STEPS.length) return;

    const stepPercent = ((currentStep + 1) / STEPS.length) * 85; // Cap at 85% until complete
    const startPercent = (currentStep / STEPS.length) * 85;

    // Animate progress within step
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= stepPercent) return prev;
        return prev + 0.5;
      });
    }, 30);

    // Move to next step
    const timer = setTimeout(() => {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, STEPS[currentStep].duration);

    setProgress(startPercent);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [currentStep, isComplete, onAnimationDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="max-w-md w-full mx-auto px-6 space-y-8 text-center">
        {/* Logo / spinner */}
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

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">
            Building your {engineLabel}
          </h2>
          <p className="text-sm text-muted-foreground">
            AI is setting up your page. You'll be able to edit everything.
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground tabular-nums">
            {Math.round(progress)}%
          </p>
        </div>

        {/* Steps list */}
        <div className="space-y-2 text-left">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStep || isComplete;
            const isActive = idx === currentStep && !isComplete;

            return (
              <div
                key={step.key}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300",
                  isDone && "opacity-60",
                  isActive && "bg-primary/5"
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-sm",
                    isDone ? "text-muted-foreground" : isActive ? "text-foreground font-medium" : "text-muted-foreground/50"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
