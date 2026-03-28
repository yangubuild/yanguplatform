import { useState, useCallback } from "react";
import type { BuilderState, Category, ChatMessage, Selection } from "../types/builder.types";
import { CATEGORY_CONFIGS } from "../types/builder.types";

const initialState: BuilderState = {
  userIdea: "",
  category: null,
  selections: [],
  finalConfig: {
    scope: null,
    assets: null,
    sections: [],
    deliveryApps: [],
    styleCategory: null,
    styleSpecific: null,
    businessName: "",
    location: "",
  },
  step: 0,
  isGenerating: false,
  messages: [],
};

export function useBuilderState() {
  const [state, setState] = useState<BuilderState>(initialState);

  const addMessage = useCallback((message: Omit<ChatMessage, "id" | "timestamp">) => {
    const msg: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setState((prev) => ({ ...prev, messages: [...prev.messages, msg] }));
    return msg;
  }, []);

  const addSelection = useCallback((selection: Omit<Selection, "timestamp">) => {
    setState((prev) => ({
      ...prev,
      selections: [...prev.selections, { ...selection, timestamp: Date.now() }],
    }));
  }, []);

  const detectCategory = useCallback((text: string): Category | null => {
    const lower = text.toLowerCase();
    for (const [key, config] of Object.entries(CATEGORY_CONFIGS)) {
      if (config.keywords.some((kw) => lower.includes(kw))) {
        return key as Category;
      }
    }
    return null;
  }, []);

  const setCategory = useCallback((cat: Category) => {
    setState((prev) => ({ ...prev, category: cat }));
  }, []);

  const updateConfig = useCallback((updates: Partial<BuilderState["finalConfig"]>) => {
    setState((prev) => ({
      ...prev,
      finalConfig: { ...prev.finalConfig, ...updates },
    }));
  }, []);

  const setStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const setGenerating = useCallback((isGenerating: boolean) => {
    setState((prev) => ({ ...prev, isGenerating }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    addMessage,
    addSelection,
    detectCategory,
    setCategory,
    updateConfig,
    setStep,
    setGenerating,
    reset,
  };
}
