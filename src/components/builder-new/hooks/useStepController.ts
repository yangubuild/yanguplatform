import { useState, useCallback, useMemo } from "react";
import type { Category } from "../types/builder.types";

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

// ─── Predefined options per step ───────────────────────────────────────

const SCOPE_OPTIONS: StepOption[] = [
  { id: "showcase", label: "🖼️ Showcase Website", value: "showcase", description: "Beautiful landing page to present your brand" },
  { id: "ordering", label: "🛒 Showcase + Ordering Links", value: "ordering_links", description: "Showcase with delivery app links (Talabat, etc.)" },
];

const ASSETS_OPTIONS: StepOption[] = [
  { id: "ai_gen", label: "🤖 AI-Generated Assets", value: "ai_generated", description: "I'll create images & logo for you" },
  { id: "have_own", label: "📸 I Have My Own", value: "user_provided", description: "I have my own logo and images" },
  { id: "mix", label: "🎨 Mix of Both", value: "mix", description: "Some mine, some AI-generated" },
];

const SECTION_OPTIONS_DEFAULT: StepOption[] = [
  { id: "hero", label: "🏠 Hero Banner", value: "hero" },
  { id: "menu", label: "📋 Menu / Products", value: "menu" },
  { id: "about", label: "📖 About Us", value: "about" },
  { id: "contact", label: "📞 Contact", value: "contact" },
  { id: "testimonials", label: "⭐ Testimonials", value: "testimonials" },
  { id: "gallery", label: "🖼️ Gallery", value: "gallery" },
  { id: "location", label: "📍 Location / Map", value: "location" },
];

const SECTION_OPTIONS_MAP: Partial<Record<Category, StepOption[]>> = {
  emenu: [
    { id: "hero", label: "🏠 Hero Banner", value: "hero" },
    { id: "menu", label: "📋 Menu", value: "menu" },
    { id: "about", label: "📖 About Us", value: "about" },
    { id: "location", label: "📍 Location", value: "location" },
    { id: "delivery", label: "🚗 Delivery Info", value: "delivery" },
    { id: "gallery", label: "🖼️ Gallery", value: "gallery" },
    { id: "testimonials", label: "⭐ Reviews", value: "testimonials" },
  ],
  eshop: [
    { id: "hero", label: "🏠 Hero Banner", value: "hero" },
    { id: "products", label: "🛍️ Products", value: "products" },
    { id: "about", label: "📖 About Us", value: "about" },
    { id: "contact", label: "📞 Contact", value: "contact" },
    { id: "testimonials", label: "⭐ Reviews", value: "testimonials" },
    { id: "faq", label: "❓ FAQ", value: "faq" },
  ],
  esite: [
    { id: "hero", label: "🏠 Hero Banner", value: "hero" },
    { id: "services", label: "🔧 Services", value: "services" },
    { id: "about", label: "📖 About", value: "about" },
    { id: "contact", label: "📞 Contact", value: "contact" },
    { id: "results", label: "📊 Results / Portfolio", value: "results" },
    { id: "testimonials", label: "⭐ Testimonials", value: "testimonials" },
  ],
  influencer: [
    { id: "hero", label: "🏠 Hero Banner", value: "hero" },
    { id: "content", label: "🎥 Content Gallery", value: "content" },
    { id: "bio", label: "📝 Bio", value: "bio" },
    { id: "contact", label: "📞 Contact", value: "contact" },
    { id: "support", label: "💝 Support / Donate", value: "support" },
  ],
  community: [
    { id: "hero", label: "🏠 Hero Banner", value: "hero" },
    { id: "programs", label: "📚 Programs / Courses", value: "programs" },
    { id: "about", label: "📖 About", value: "about" },
    { id: "contact", label: "📞 Contact", value: "contact" },
    { id: "events", label: "📅 Events", value: "events" },
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
  { id: "bold", label: "🔥 Bold & Vibrant", value: "bold", description: "High-energy, eye-catching colors and strong typography" },
  { id: "warm", label: "☕ Warm & Cozy", value: "warm", description: "Earthy tones, soft textures, inviting feel" },
  { id: "clean", label: "✨ Clean & Minimal", value: "clean", description: "Lots of whitespace, sharp lines, modern elegance" },
  { id: "premium", label: "💎 Premium & Luxury", value: "premium", description: "Dark themes, gold accents, high-end feel" },
  { id: "playful", label: "🎉 Playful & Fun", value: "playful", description: "Bright colors, rounded shapes, friendly vibe" },
];

const STYLE_SPECIFIC_MAP: Record<string, StepOption[]> = {
  bold: [
    { id: "vibrant_pop", label: "Vibrant Pop Art", value: "vibrant_pop", description: "Neon accents, comic-style energy" },
    { id: "neon_glow", label: "Neon Glow", value: "neon_glow", description: "Glowing neon on dark background" },
    { id: "street_bold", label: "Street Bold", value: "street_bold", description: "Urban graffiti-inspired, raw energy" },
  ],
  warm: [
    { id: "rustic_wood", label: "Rustic Wood", value: "rustic_wood", description: "Natural wood textures, farm-to-table feel" },
    { id: "golden_hour", label: "Golden Hour", value: "golden_hour", description: "Warm sunset tones, soft golden light" },
    { id: "heritage", label: "Heritage Classic", value: "heritage", description: "Traditional patterns, timeless warmth" },
  ],
  clean: [
    { id: "swiss_minimal", label: "Swiss Minimal", value: "swiss_minimal", description: "Grid-based, ultra-clean typography" },
    { id: "soft_pastel", label: "Soft Pastel", value: "soft_pastel", description: "Light pastels, airy and spacious" },
    { id: "mono_sharp", label: "Monochrome Sharp", value: "mono_sharp", description: "Black & white with sharp contrast" },
  ],
  premium: [
    { id: "dark_gold", label: "Dark & Gold", value: "dark_gold", description: "Black background, gold accents" },
    { id: "marble_lux", label: "Marble Luxury", value: "marble_lux", description: "Marble textures, sophisticated elegance" },
    { id: "noir_class", label: "Noir Classique", value: "noir_class", description: "Deep dark tones, minimal luxury" },
  ],
  playful: [
    { id: "tropical_burst", label: "Tropical Burst", value: "tropical_burst", description: "Bright tropical colors, fun patterns" },
    { id: "candy_pop", label: "Candy Pop", value: "candy_pop", description: "Sweet pastel pinks and purples" },
    { id: "retro_fun", label: "Retro Fun", value: "retro_fun", description: "80s/90s nostalgia, bold retro vibes" },
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);

  const isFoodCategory = useMemo(() => {
    return category === "emenu";
  }, [category]);

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
          adaMessage: "Welcome! Let's build your website. First, tell me — what type of website do you need?",
          options: SCOPE_OPTIONS,
          renderAs: "cards",
        };
      case "scope":
        return {
          key: "scope",
          adaMessage: "Great choice! Now, do you have your own images and logo, or should I create them for you?",
          options: ASSETS_OPTIONS,
          renderAs: "cards",
        };
      case "assets":
        return {
          key: "assets",
          adaMessage: "Perfect! Which sections would you like on your website? Select all that apply, then tap **Done** when ready.",
          options: SECTION_OPTIONS_MAP[category!] || SECTION_OPTIONS_DEFAULT,
          multiSelect: true,
          renderAs: "chips",
        };
      case "sections":
        if (isFoodCategory) {
          return {
            key: "sections",
            adaMessage: "Since you're in the food business, which delivery apps should I link? Select all that apply, then tap **Done**.",
            options: DELIVERY_APP_OPTIONS,
            multiSelect: true,
            renderAs: "chips",
          };
        }
        return {
          key: "sections",
          adaMessage: "Now let's pick a style direction. Which vibe fits your brand?",
          options: STYLE_CATEGORY_OPTIONS,
          renderAs: "carousel",
        };
      case "delivery_apps":
        return {
          key: "delivery_apps",
          adaMessage: "Now let's pick a style direction. Which vibe fits your brand?",
          options: STYLE_CATEGORY_OPTIONS,
          renderAs: "carousel",
        };
      case "style_category":
        return {
          key: "style_category",
          adaMessage: `Love it! Here are specific styles within that category. Pick your favorite:`,
          options: STYLE_SPECIFIC_MAP[selectedStyleCategory || "bold"] || STYLE_SPECIFIC_MAP.bold,
          renderAs: "carousel",
        };
      case "style_specific":
        return {
          key: "style_specific",
          adaMessage: buildConfirmationMessage(),
          options: [
            { id: "generate", label: "🚀 Generate My Website", value: "generate", description: "Let's build it!" },
            { id: "start_over", label: "🔄 Start Over", value: "start_over", description: "Reset all selections" },
          ],
          renderAs: "cards",
        };
      case "confirmation":
        return {
          key: "confirmation",
          adaMessage: "Your website is being generated...",
          options: [],
        };
      case "generation":
      case "refinement":
        return {
          key: "refinement",
          adaMessage: "Your website is ready! You can refine it below.",
          options: [
            { id: "change_style", label: "🎨 Change Style", value: "change_style" },
            { id: "change_sections", label: "📄 Change Sections", value: "change_sections" },
            { id: "regenerate", label: "🔄 Regenerate", value: "regenerate" },
          ],
          allowFreeText: true,
          renderAs: "chips",
        };
      default:
        return { key: "greeting", adaMessage: "", options: [] };
    }
  }, [currentStep, category, isFoodCategory, selectedStyleCategory]);

  const buildConfirmationMessage = useCallback(() => {
    const lines = ["Here's a summary of your choices:\n"];
    if (selectedScope) lines.push(`• **Type:** ${selectedScope}`);
    if (selectedAssets) lines.push(`• **Assets:** ${selectedAssets}`);
    if (selectedSections.length) lines.push(`• **Sections:** ${selectedSections.join(", ")}`);
    if (selectedDeliveryApps.length) lines.push(`• **Delivery Apps:** ${selectedDeliveryApps.join(", ")}`);
    if (selectedStyleCategory) lines.push(`• **Style:** ${selectedStyleCategory}`);
    if (selectedStyleSpecific) lines.push(`• **Specific Style:** ${selectedStyleSpecific}`);
    lines.push("\nReady to generate?");
    return lines.join("\n");
  }, [selectedScope, selectedAssets, selectedSections, selectedDeliveryApps, selectedStyleCategory, selectedStyleSpecific]);

  const handleOptionSelect = useCallback((option: StepOption) => {
    switch (currentStep) {
      case "greeting":
        setSelectedScope(option.label);
        setCurrentStep("scope");
        break;
      case "scope":
        setSelectedAssets(option.label);
        setCurrentStep("assets");
        break;
      case "assets":
        // Multi-select — toggle
        setSelectedSections(prev =>
          prev.includes(option.value) ? prev.filter(v => v !== option.value) : [...prev, option.value]
        );
        break;
      case "sections":
        if (isFoodCategory) {
          setSelectedDeliveryApps(prev =>
            prev.includes(option.value) ? prev.filter(v => v !== option.value) : [...prev, option.value]
          );
        } else {
          setSelectedStyleCategory(option.value);
          setCurrentStep("style_category");
        }
        break;
      case "delivery_apps":
        setSelectedStyleCategory(option.value);
        setCurrentStep("style_category");
        break;
      case "style_category":
        setSelectedStyleSpecific(option.value);
        setCurrentStep("style_specific");
        break;
      case "style_specific":
        if (option.value === "generate") {
          setCurrentStep("confirmation");
        } else if (option.value === "start_over") {
          resetAll();
        }
        break;
      case "refinement":
        if (option.value === "change_style") {
          setCurrentStep("delivery_apps"); // go to style_category step
        } else if (option.value === "change_sections") {
          setCurrentStep("assets"); // go to sections step
        } else if (option.value === "regenerate") {
          setCurrentStep("confirmation");
        }
        break;
    }
  }, [currentStep, isFoodCategory]);

  // For multi-select steps, confirm and advance
  const confirmMultiSelect = useCallback(() => {
    if (currentStep === "assets") {
      // sections selected, move on
      if (isFoodCategory) {
        setCurrentStep("sections");
      } else {
        setCurrentStep("sections"); // goes to style via getStepConfig logic
      }
    } else if (currentStep === "sections" && isFoodCategory) {
      setCurrentStep("delivery_apps");
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
    setIsGenerating(false);
    setGeneratedHtml(null);
  }, []);

  const inputAllowed = useMemo(() => {
    return currentStep === "refinement";
  }, [currentStep]);

  return {
    currentStep,
    setCurrentStep,
    category,
    setCategory,
    getStepConfig,
    getNextStep,
    handleOptionSelect,
    confirmMultiSelect,
    resetAll,
    inputAllowed,
    // Selections
    selectedScope,
    selectedAssets,
    selectedSections,
    selectedDeliveryApps,
    selectedStyleCategory,
    selectedStyleSpecific,
    businessName,
    setBusinessName,
    // Generation
    isGenerating,
    setIsGenerating,
    generatedHtml,
    setGeneratedHtml,
    isFoodCategory,
  };
}
