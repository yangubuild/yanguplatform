import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Manages social media onboarding state.
 * Phase 1: localStorage-based. Phase 2: Supabase-backed.
 */
export function useSocialOnboarding() {
  const { user } = useAuth();
  const storageKey = user ? `yangu_social_onboarded_${user.id}` : null;
  const stepsKey = user ? `yangu_social_steps_${user.id}` : null;

  const [isOnboarded, setIsOnboarded] = useState(() => {
    if (!storageKey) return false;
    return localStorage.getItem(storageKey) === "true";
  });

  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    if (!stepsKey) return [];
    try { return JSON.parse(localStorage.getItem(stepsKey) || "[]"); } catch { return []; }
  });

  const [showOnboarding, setShowOnboarding] = useState(!isOnboarded);

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, String(isOnboarded));
    }
  }, [isOnboarded, storageKey]);

  useEffect(() => {
    if (stepsKey) {
      localStorage.setItem(stepsKey, JSON.stringify(completedSteps));
    }
  }, [completedSteps, stepsKey]);

  const completeOnboarding = (steps: string[]) => {
    setCompletedSteps(steps);
    setIsOnboarded(true);
    setShowOnboarding(false);
  };

  const markStep = (step: string) => {
    setCompletedSteps((prev) => prev.includes(step) ? prev : [...prev, step]);
  };

  return { isOnboarded, completedSteps, showOnboarding, setShowOnboarding, completeOnboarding, markStep };
}
