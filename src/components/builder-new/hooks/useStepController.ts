import { useState, useCallback, useMemo } from "react";
import type { Category, CategoryConfig, CATEGORY_CONFIGS as CatConfigs } from "../types/builder.types";
import { CATEGORY_CONFIGS } from "../types/builder.types";

export type BuilderStep =
  | "greeting"
  | "scope"
  | "assets"
  | "sections"
  | "delivery_apps"
  | "style_category"
  | "style_specific"
  | "confirmation"
  | "generation"
  | "refinement";

export interface StepOption {
  id: string;
  label: string;
  value: string;
  description?: string;
  icon?: string;
  previewImage?: string;
}

export interface StepConfig {
  key: BuilderStep;
  adaMessage: string;
  options: StepOption[];
  multiSelect?: boolean;
  allowFreeText?: boolean;
  renderAs?: "chips" | "cards" | "carousel";
}

// ─── Category detection ────────────────────────────────────────────────

export function detectCategory(text: string): Category {
  const lower = text.toLowerCase();
  for (const [key, config] of Object.entries(CATEGORY_CONFIGS)) {
    if (config.keywords.some((kw: string) => lower.includes(kw))) {
      return key as Category;
    }
  }
  return "esite"; // default
}

export function extractBusinessName(text: string): string {
  // Try to extract quoted or capitalized names
  const quotedMatch = text.match(/["']([^"']+)["']/);
  if (quotedMatch) return quotedMatch[1];
  
  // Try comma-separated first part
  const commaParts = text.split(",");
  if (commaParts.length > 1) {
    const first = commaParts[0].trim();
    if (first.length <= 40 && first.split(" ").length <= 5) return first;
  }
  
  // Try first few capitalized words
  const words = text.split(/\s+/);
  const capWords = words.filter(w => /^[A-Z]/.test(w) && w.length > 1).slice(0, 3);
  if (capWords.length > 0) return capWords.join(" ");
  
  return "My Website";
}

// ─── Predefined options per step ───────────────────────────────────────

const SCOPE_OPTIONS: StepOption[] = [
  { id: "showcase", label: "Showcase Website", value: "showcase", description: "Beautiful landing page to present your brand" },
  { id: "ordering", label: "Showcase + Ordering Links", value: "ordering_links", description: "Showcase with delivery app links" },
];

const ASSETS_OPTIONS: StepOption[] = [
  { id: "ai_gen", label: "AI-Generated Assets", value: "ai_generated", description: "I'll create images & logo for you" },
  { id: "have_own", label: "I Have My Own", value: "user_provided", description: "I have my own logo and images" },
  { id: "mix", label: "Mix of Both", value: "mix", description: "Some mine, some AI-generated" },
];

const SECTION_OPTIONS_DEFAULT: StepOption[] = [
  { id: "hero", label: "Hero Banner", value: "hero" },
  { id: "menu", label: "Menu / Products", value: "menu" },
  { id: "about", label: "About Us", value: "about" },
  { id: "contact", label: "Contact", value: "contact" },
  { id: "testimonials", label: "Testimonials", value: "testimonials" },
  { id: "gallery", label: "Gallery", value: "gallery" },
  { id: "location", label: "Location / Map", value: "location" },
];

const SECTION_OPTIONS_MAP: Partial<Record<Category, StepOption[]>> = {
  emenu: [
    { id: "hero", label: "Hero Banner", value: "hero" },
    { id: "menu", label: "Menu", value: "menu" },
    { id: "about", label: "About Us", value: "about" },
    { id: "location", label: "Location", value: "location" },
    { id: "delivery", label: "Delivery Info", value: "delivery" },
    { id: "gallery", label: "Gallery", value: "gallery" },
    { id: "testimonials", label: "Reviews", value: "testimonials" },
  ],
  eshop: [
    { id: "hero", label: "Hero Banner", value: "hero" },
    { id: "products", label: "Products", value: "products" },
    { id: "about", label: "About Us", value: "about" },
    { id: "contact", label: "Contact", value: "contact" },
    { id: "testimonials", label: "Reviews", value: "testimonials" },
    { id: "faq", label: "FAQ", value: "faq" },
  ],
  esite: [
    { id: "hero", label: "Hero Banner", value: "hero" },
    { id: "services", label: "Services", value: "services" },
    { id: "about", label: "About", value: "about" },
    { id: "contact", label: "Contact", value: "contact" },
    { id: "results", label: "Results / Portfolio", value: "results" },
    { id: "testimonials", label: "Testimonials", value: "testimonials" },
  ],
  influencer: [
    { id: "hero", label: "Hero / Bio", value: "hero" },
    { id: "content", label: "Content Gallery", value: "content" },
    { id: "bio", label: "About Me", value: "bio" },
    { id: "links", label: "Links", value: "links" },
    { id: "contact", label: "Contact", value: "contact" },
    { id: "support", label: "Support / Donate", value: "support" },
  ],
  community: [
    { id: "hero", label: "Hero Banner", value: "hero" },
    { id: "programs", label: "Programs / Courses", value: "programs" },
    { id: "about", label: "About", value: "about" },
    { id: "contact", label: "Contact", value: "contact" },
    { id: "events", label: "Events", value: "events" },
  ],
};

const DELIVERY_APP_OPTIONS: StepOption[] = [
  { id: "talabat", label: "Talabat", value: "talabat" },
  { id: "deliveroo", label: "Deliveroo", value: "deliveroo" },
  { id: "noon", label: "Noon Food", value: "noon_food" },
  { id: "careem", label: "Careem", value: "careem" },
  { id: "zomato", label: "Zomato", value: "zomato" },
  { id: "ubereats", label: "Uber Eats", value: "ubereats" },
];

const STYLE_CATEGORY_OPTIONS: StepOption[] = [
  { id: "bold", label: "Bold & Vibrant", value: "bold", description: "High-energy, eye-catching" },
  { id: "warm", label: "Warm & Cozy", value: "warm", description: "Earthy tones, inviting feel" },
  { id: "clean", label: "Clean & Minimal", value: "clean", description: "Whitespace, modern elegance" },
  { id: "premium", label: "Premium & Luxury", value: "premium", description: "Dark themes, high-end" },
  { id: "playful", label: "Playful & Fun", value: "playful", description: "Bright, friendly vibe" },
];

const STYLE_SPECIFIC_MAP: Record<string, StepOption[]> = {
  bold: [
    { id: "vibrant_pop", label: "Vibrant Pop Art", value: "vibrant_pop", description: "Neon accents, comic-style energy" },
    { id: "neon_glow", label: "Neon Glow", value: "neon_glow", description: "Glowing neon on dark" },
    { id: "street_bold", label: "Street Bold", value: "street_bold", description: "Urban graffiti-inspired" },
  ],
  warm: [
    { id: "rustic_wood", label: "Rustic Wood", value: "rustic_wood", description: "Natural wood, farm-to-table" },
    { id: "golden_hour", label: "Golden Hour", value: "golden_hour", description: "Warm sunset tones" },
    { id: "heritage", label: "Heritage Classic", value: "heritage", description: "Traditional, timeless" },
  ],
  clean: [
    { id: "swiss_minimal", label: "Swiss Minimal", value: "swiss_minimal", description: "Grid-based, ultra-clean" },
    { id: "soft_pastel", label: "Soft Pastel", value: "soft_pastel", description: "Light pastels, airy" },
    { id: "mono_sharp", label: "Monochrome Sharp", value: "mono_sharp", description: "Black & white contrast" },
  ],
  premium: [
    { id: "dark_gold", label: "Dark & Gold", value: "dark_gold", description: "Black, gold accents" },
    { id: "marble_lux", label: "Marble Luxury", value: "marble_lux", description: "Marble, sophisticated" },
    { id: "noir_class", label: "Noir Classique", value: "noir_class", description: "Deep dark, minimal luxury" },
  ],
  playful: [
    { id: "tropical_burst", label: "Tropical Burst", value: "tropical_burst", description: "Bright tropical colors" },
    { id: "candy_pop", label: "Candy Pop", value: "candy_pop", description: "Sweet pastel pinks" },
    { id: "retro_fun", label: "Retro Fun", value: "retro_fun", description: "80s/90s nostalgia" },
  ],
};

// ─── Hook ──────────────────────────────────────────────────────────────

export function useStepController() {
  const [currentStep, setCurrentStep] = useState<BuilderStep>("greeting");
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedScope, setSelectedScope] = useState<string | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<string | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedDeliveryApps, setSelectedDeliveryApps] = useState<string[]>([]);
  const [selectedStyleCategory, setSelectedStyleCategory] = useState<string | null>(null);
  const [selectedStyleSpecific, setSelectedStyleSpecific] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [userIdea, setUserIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);

  const isFoodCategory = useMemo(() => category === "emenu", [category]);

  const getNextStep = useCallback((step: BuilderStep): BuilderStep => {
    switch (step) {
      case "greeting": return "scope";
      case "scope": return "assets";
      case "assets": return "sections";
      case "sections": return isFoodCategory ? "delivery_apps" : "style_category";
      case "delivery_apps": return "style_category";
      case "style_category": return "style_specific";
      case "style_specific": return "confirmation";
      case "confirmation": return "generation";
      case "generation": return "refinement";
      default: return "refinement";
    }
  }, [isFoodCategory]);

  const getStepConfig = useCallback((): StepConfig => {
    switch (currentStep) {
      case "greeting":
        return {
          key: "greeting",
          adaMessage: "Hey! 👋 Tell me about your business — what's the name, what do you do, and what are you looking to build?",
          options: [],
          allowFreeText: true,
        };
      case "scope":
        return {
          key: "scope",
          adaMessage: `Got it! I detected this as a **${CATEGORY_CONFIGS[category!]?.label || "Business"}** website (${CATEGORY_CONFIGS[category!]?.domain || ".site"}). What type of website do you need?`,
          options: SCOPE_OPTIONS,
          renderAs: "cards",
        };
      case "assets":
        return {
          key: "assets",
          adaMessage: "Do you have your own images and logo, or should I create them?",
          options: ASSETS_OPTIONS,
          renderAs: "cards",
        };
      case "sections":
        return {
          key: "sections",
          adaMessage: "Which sections do you want? Select all that apply, then tap **Done**.",
          options: SECTION_OPTIONS_MAP[category!] || SECTION_OPTIONS_DEFAULT,
          multiSelect: true,
          renderAs: "chips",
        };
      case "delivery_apps":
        return {
          key: "delivery_apps",
          adaMessage: "Which delivery apps should I link? Select all, then tap **Done**.",
          options: DELIVERY_APP_OPTIONS,
          multiSelect: true,
          renderAs: "chips",
        };
      case "style_category":
        return {
          key: "style_category",
          adaMessage: "Pick a style direction for your brand:",
          options: STYLE_CATEGORY_OPTIONS,
          renderAs: "carousel",
        };
      case "style_specific":
        return {
          key: "style_specific",
          adaMessage: "Pick the specific style you like:",
          options: STYLE_SPECIFIC_MAP[selectedStyleCategory || "bold"] || STYLE_SPECIFIC_MAP.bold,
          renderAs: "carousel",
        };
      case "confirmation":
        return {
          key: "confirmation",
          adaMessage: buildConfirmationMessage(),
          options: [
            { id: "generate", label: "Generate My Website", value: "generate" },
            { id: "start_over", label: "Start Over", value: "start_over" },
          ],
          renderAs: "cards",
        };
      case "generation":
      case "refinement":
        return {
          key: "refinement",
          adaMessage: "Your website is ready! Refine it using the tools or chat below.",
          options: [
            { id: "change_style", label: "Change Style", value: "change_style" },
            { id: "change_sections", label: "Change Sections", value: "change_sections" },
            { id: "regenerate", label: "Regenerate", value: "regenerate" },
          ],
          allowFreeText: true,
          renderAs: "chips",
        };
      default:
        return { key: "greeting", adaMessage: "", options: [] };
    }
  }, [currentStep, category, isFoodCategory, selectedStyleCategory]);

  const buildConfirmationMessage = useCallback(() => {
    const lines = ["Here's your summary:\n"];
    if (category) lines.push(`• **Category:** ${CATEGORY_CONFIGS[category].label}`);
    if (selectedScope) lines.push(`• **Type:** ${selectedScope}`);
    if (selectedAssets) lines.push(`• **Assets:** ${selectedAssets}`);
    if (selectedSections.length) lines.push(`• **Sections:** ${selectedSections.join(", ")}`);
    if (selectedDeliveryApps.length) lines.push(`• **Delivery Apps:** ${selectedDeliveryApps.join(", ")}`);
    if (selectedStyleCategory) lines.push(`• **Style:** ${selectedStyleCategory}`);
    if (selectedStyleSpecific) lines.push(`• **Specific Style:** ${selectedStyleSpecific}`);
    lines.push("\nReady to generate?");
    return lines.join("\n");
  }, [category, selectedScope, selectedAssets, selectedSections, selectedDeliveryApps, selectedStyleCategory, selectedStyleSpecific]);

  const handleGreetingInput = useCallback((text: string) => {
    const detected = detectCategory(text);
    const name = extractBusinessName(text);
    setCategory(detected);
    setBusinessName(name);
    setUserIdea(text);
    setCurrentStep("scope");
  }, []);

  const handleOptionSelect = useCallback((option: StepOption) => {
    switch (currentStep) {
      case "scope":
        setSelectedScope(option.label);
        setCurrentStep("assets");
        break;
      case "assets":
        setSelectedAssets(option.label);
        setCurrentStep("sections");
        break;
      case "sections":
        // Multi-select — toggle
        setSelectedSections(prev =>
          prev.includes(option.value) ? prev.filter(v => v !== option.value) : [...prev, option.value]
        );
        break;
      case "delivery_apps":
        setSelectedDeliveryApps(prev =>
          prev.includes(option.value) ? prev.filter(v => v !== option.value) : [...prev, option.value]
        );
        break;
      case "style_category":
        setSelectedStyleCategory(option.value);
        setCurrentStep("style_specific");
        break;
      case "style_specific":
        setSelectedStyleSpecific(option.value);
        setCurrentStep("confirmation");
        break;
      case "confirmation":
        if (option.value === "generate") {
          setCurrentStep("generation");
        } else if (option.value === "start_over") {
          resetAll();
        }
        break;
      case "refinement":
        if (option.value === "change_style") {
          setCurrentStep("style_category");
        } else if (option.value === "change_sections") {
          setCurrentStep("sections");
        } else if (option.value === "regenerate") {
          setCurrentStep("generation");
        }
        break;
    }
  }, [currentStep]);

  const confirmMultiSelect = useCallback(() => {
    if (currentStep === "sections") {
      if (isFoodCategory) {
        setCurrentStep("delivery_apps");
      } else {
        setCurrentStep("style_category");
      }
    } else if (currentStep === "delivery_apps") {
      setCurrentStep("style_category");
    }
  }, [currentStep, isFoodCategory]);

  const resetAll = useCallback(() => {
    setCurrentStep("greeting");
    setCategory(null);
    setSelectedScope(null);
    setSelectedAssets(null);
    setSelectedSections([]);
    setSelectedDeliveryApps([]);
    setSelectedStyleCategory(null);
    setSelectedStyleSpecific(null);
    setBusinessName("");
    setUserIdea("");
    setIsGenerating(false);
    setGeneratedHtml(null);
  }, []);

  const inputAllowed = useMemo(() => {
    return currentStep === "greeting" || currentStep === "refinement";
  }, [currentStep]);

  return {
    currentStep,
    setCurrentStep,
    category,
    setCategory,
    getStepConfig,
    getNextStep,
    handleOptionSelect,
    handleGreetingInput,
    confirmMultiSelect,
    resetAll,
    inputAllowed,
    selectedScope,
    selectedAssets,
    selectedSections,
    selectedDeliveryApps,
    selectedStyleCategory,
    selectedStyleSpecific,
    businessName,
    setBusinessName,
    userIdea,
    setUserIdea,
    isGenerating,
    setIsGenerating,
    generatedHtml,
    setGeneratedHtml,
    isFoodCategory,
  };
}
