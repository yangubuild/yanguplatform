/**
 * AI Building Progress — stepper with live progress + completion CTA.
 */

import { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import yanguYLoader from "@/assets/yangu-y-loader.png";

const STEPS = [
  { key: "name", label: "Setting up your name" },
  { key: "industry", label: "Analyzing your industry" },
  { key: "brand", label: "Crafting your brand" },
  { key: "building", label: "Building pages & sections" },
  { key: "images", label: "Selecting images" },
  { key: "finalizing", label: "Finalizing your site" },
] as const;

const STEP_DURATIONS = [1800, 2200, 2400, 3500, 2000, 1500];

interface Props {
  engineLabel: string;
  isComplete: boolean;
  onAnimationDone: () => void | Promise<void>;
  editorUrl?: string | null;
}

export function AiBuildingProgress({ engineLabel, isComplete, onAnimationDone, editorUrl }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const doneCalledRef = useRef(false);

  useEffect(() => {
    if (isComplete) {
      setCurrentStep(STEPS.length);
      setProgress(100);
      if (!doneCalledRef.current) {
        doneCalledRef.current = true;
        const t = setTimeout(() => {
          setShowCompletion(true);
          void Promise.resolve(onAnimationDone()).catch((error) => {
            console.error("[AiBuildingProgress] Auto-route failed", error);
          });
        }, 900);
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

  const activeDetail = "AI is setting up your page. You'll be able to edit everything.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="max-w-md w-full space-y-8 px-6">
        <div className="flex justify-center">
          <img
            src={yanguYLoader}
            alt="yangu"
            className={cn("h-12 w-12 object-contain", !isComplete && "animate-spin")}
            style={{ animationDuration: "3s" }}
          />
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-foreground">Building your {engineLabel}</h2>
          <p className="text-sm text-muted-foreground">{activeDetail}</p>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground tabular-nums">{Math.round(progress)}%</p>
        </div>

        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStep || isComplete;
            const isActive = idx === currentStep && !isComplete;
            return (
              <div
                key={step.key}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm",
                  isActive && "bg-muted/50 text-foreground font-medium",
                  isDone && "text-muted-foreground",
                  !isDone && !isActive && "text-muted-foreground/50"
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                )}
                {step.label}
              </div>
            );
          })}
        </div>

        {showCompletion && (
          <div className="space-y-3 pt-4">
            <p className="text-center text-sm text-muted-foreground">Done. Your page is ready.</p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => window.history.back()}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  if (editorUrl) {
                    window.location.assign(editorUrl);
                    return;
                  }
                  void Promise.resolve(onAnimationDone()).catch((error) => {
                    console.error("[AiBuildingProgress] Open editor fallback failed", error);
                  });
                }}
              >
                Open editor
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

