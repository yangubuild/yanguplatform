/**
 * Speak to Build — Independent voice-first onboarding flow.
 *
 * IMPORTANT: This module is fully decoupled from the event-stream ADA
 * "Build with Chat" system. It does NOT use events[], the mutation engine,
 * or the chat builder schema. It is a simple sequential state machine that
 * collects answers and forwards them to the existing `handleComplete`
 * pipeline used by the entry pages.
 */

import type { AdaLanguage } from "@/lib/voice/languageDetect";

export type SpeakStepId =
  | "intro"
  | "category"
  | "business_info"
  | "logo"
  | "logo_create"
  | "colors"
  | "location"
  | "style"
  | "building"
  | "done";

export type SpeakCategory =
  | "eshop"
  | "emenu"
  | "esite"
  | "influencer"
  | "community"
  | "estore";

export interface SpeakAnswers {
  category: SpeakCategory | null;
  business_name: string;
  business_description: string;
  has_logo: boolean | null;
  wants_ai_logo: boolean | null;
  brand_colors: string;
  primary_color: string;
  location: string;
  style: string;
  language: AdaLanguage;
}

export interface SpeakStepCopy {
  prompt: string;
  options?: { value: string; label: string }[];
}

export const DEFAULT_ANSWERS: SpeakAnswers = {
  category: null,
  business_name: "",
  business_description: "",
  has_logo: null,
  wants_ai_logo: null,
  brand_colors: "",
  primary_color: "#2563eb",
  location: "",
  style: "",
  language: "en",
};