import { useState, useCallback, useMemo } from "react";
import type { Category } from "../types/builder.types";
import { CATEGORY_CONFIGS } from "../types/builder.types";
import { EMENU_TEMPLATE_GROUPS } from "@/lib/builder/emenu/templateClassifier";
import { classifyEmenu } from "@/lib/builder/emenu/templateFirstGeneration";
import { getTemplate } from "@/config/templateRegistry";
import type { MenuComplexity } from "@/lib/builder/emenu/types";

export type BuilderStep =
  | "greeting"
  | "business_type"
  | "scope"
  | "assets"
  | "asset_upload"
  | "ai_logo"
  | "sections"
  | "business_location"
  | "delivery_apps"
  | "template_choice"
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
  renderAs?: "chips" | "cards" | "carousel" | "upload" | "location_input" | "ai_logo";
}

// ─── Category detection ────────────────────────────────────────────────

export function detectCategory(text: string): Category {
  const lower = text.toLowerCase();
  for (const [key, config] of Object.entries(CATEGORY_CONFIGS)) {
    if (config.keywords.some((kw: string) => lower.includes(kw))) {
      return key as Category;
    }
  }
  return "esite";
}

export function extractBusinessName(text: string): string {
  const quotedMatch = text.match(/["']([^"']+)["']/);
  if (quotedMatch) return quotedMatch[1];
  const commaParts = text.split(",");
  if (commaParts.length > 1) {
    const first = commaParts[0].trim();
    if (first.length <= 40 && first.split(" ").length <= 5) return first;
  }
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

const EMENU_BUSINESS_TYPE_OPTIONS: StepOption[] = [
  { id: "simple_cafe", label: "Simple Food / Café", value: "simple_cafe", icon: "☕", description: "Café, bakery, juice bar, ice cream, dessert shop, small menu" },
  { id: "bigger_menu", label: "Bigger Menu / Multi-Category", value: "bigger_menu", icon: "🍽️", description: "Restaurant with many categories, full-course meals, grill, takeaway" },
  { id: "reservation", label: "Reservation / Dine-In Experience", value: "reservation", icon: "🥂", description: "Fine dining, hotel restaurant, lounge, book-a-table" },
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

// ─── Delivery apps by region ─────────────────────────────────────────

interface DeliveryRegion {
  apps: StepOption[];
}

const DELIVERY_REGIONS: Record<string, DeliveryRegion> = {
  uae: {
    apps: [
      { id: "talabat", label: "Talabat", value: "talabat" },
      { id: "deliveroo", label: "Deliveroo", value: "deliveroo" },
      { id: "noon", label: "Noon Food", value: "noon_food" },
      { id: "careem", label: "Careem", value: "careem" },
      { id: "zomato", label: "Zomato", value: "zomato" },
    ],
  },
  saudi: {
    apps: [
      { id: "hungerstation", label: "HungerStation", value: "hungerstation" },
      { id: "jahez", label: "Jahez", value: "jahez" },
      { id: "toyou", label: "ToYou", value: "toyou" },
      { id: "careem", label: "Careem", value: "careem" },
      { id: "talabat", label: "Talabat", value: "talabat" },
    ],
  },
  egypt: {
    apps: [
      { id: "talabat", label: "Talabat", value: "talabat" },
      { id: "elmenus", label: "Elmenus", value: "elmenus" },
    ],
  },
  global: {
    apps: [
      { id: "ubereats", label: "Uber Eats", value: "ubereats" },
      { id: "doordash", label: "DoorDash", value: "doordash" },
      { id: "deliveroo", label: "Deliveroo", value: "deliveroo" },
      { id: "grubhub", label: "Grubhub", value: "grubhub" },
    ],
  },
};

const SELF_DELIVERY_OPTIONS: StepOption[] = [
  { id: "self_delivery", label: "Self Delivery / In-House", value: "self_delivery" },
  { id: "pickup_only", label: "Pickup Only", value: "pickup_only" },
];

function detectRegion(location: string): string {
  const lower = location.toLowerCase();
  if (lower.includes("uae") || lower.includes("dubai") || lower.includes("abu dhabi") || lower.includes("sharjah")) return "uae";
  if (lower.includes("saudi") || lower.includes("riyadh") || lower.includes("jeddah") || lower.includes("ksa")) return "saudi";
  if (lower.includes("egypt") || lower.includes("cairo")) return "egypt";
  return "global";
}

function getDeliveryOptions(location: string): StepOption[] {
  const region = detectRegion(location);
  const regionApps = DELIVERY_REGIONS[region]?.apps || DELIVERY_REGIONS.global.apps;
  return [...regionApps, ...SELF_DELIVERY_OPTIONS];
}

// ─── Emenu template options for template_choice step ─────────────────

function getEmenuTemplateOptions(classification: MenuComplexity): StepOption[] {
  const group = EMENU_TEMPLATE_GROUPS.find(g => g.complexity === classification);
  if (!group) return [];

  return group.templateKeys.map(key => {
    const preset = getTemplate("emenu", key);
    return {
      id: key,
      label: preset?.label || key,
      value: key,
      description: preset?.description || "",
      icon: preset?.icon || "🍽️",
    };
  });
}

// ─── User assets state ───────────────────────────────────────────────

export interface UserAssets {
  logoUrl?: string;
  brandColors: string[];
  images: Array<{ url: string; purpose: string }>;
}

// ─── Hook ──────────────────────────────────────────────────────────────

export function useStepController() {
  const [currentStep, setCurrentStep] = useState<BuilderStep>("greeting");
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedScope, setSelectedScope] = useState<string | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<string | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedDeliveryApps, setSelectedDeliveryApps] = useState<string[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [userIdea, setUserIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [businessLocation, setBusinessLocation] = useState("");
  const [menuClassification, setMenuClassification] = useState<MenuComplexity | null>(null);
  const [userUploadedAssets, setUserUploadedAssets] = useState<UserAssets>({
    brandColors: [],
    images: [],
  });

  const isFoodCategory = useMemo(() => category === "emenu", [category]);

  // Classify emenu on greeting
  const classifyOnGreeting = useCallback((text: string, detectedCategory: Category) => {
    if (detectedCategory === "emenu") {
      const classification = classifyEmenu({
        userIdea: text,
        businessName: extractBusinessName(text),
      });
      setMenuClassification(classification);
    }
  }, []);

  const getNextStep = useCallback((step: BuilderStep): BuilderStep => {
    switch (step) {
      case "greeting": return isFoodCategory ? "business_type" : "scope";
      case "business_type": return "scope";
      case "scope": return "assets";
      case "assets":
        if (selectedAssets === "ai_generated") return "ai_logo";
        return selectedAssets === "user_provided" || selectedAssets === "mix" ? "asset_upload" : "sections";
      case "ai_logo": return "sections";
      case "asset_upload": return "sections";
      case "sections": return isFoodCategory ? "business_location" : "template_choice";
      case "business_location": return "delivery_apps";
      case "delivery_apps": return "template_choice";
      case "template_choice": return "confirmation";
      case "confirmation": return "generation";
      case "generation": return "refinement";
      default: return "refinement";
    }
  }, [isFoodCategory, selectedAssets]);

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
      case "asset_upload":
        return {
          key: "asset_upload",
          adaMessage: "Great! Upload your assets below. Add your **logo**, pick your **brand colors**, and upload **images** (menu photos, restaurant interior, team, etc.).\n\nPlease upload at least 3 images.",
          options: [],
          renderAs: "upload",
        };
      case "sections":
        return {
          key: "sections",
          adaMessage: "Which sections do you want? Select all that apply, then tap **Done**.",
          options: SECTION_OPTIONS_MAP[category!] || SECTION_OPTIONS_DEFAULT,
          multiSelect: true,
          renderAs: "chips",
        };
      case "business_location":
        return {
          key: "business_location",
          adaMessage: "Where is your business based? This helps me show the right delivery platforms for your area.",
          options: [],
          allowFreeText: true,
          renderAs: "location_input",
        };
      case "delivery_apps":
        return {
          key: "delivery_apps",
          adaMessage: `Here are the delivery options available in your area. Select all that apply, then tap **Done**.`,
          options: getDeliveryOptions(businessLocation),
          multiSelect: true,
          renderAs: "chips",
        };
      case "template_choice": {
        // For emenu, show real template previews from the classified pool
        if (category === "emenu" && menuClassification) {
          const templateOpts = getEmenuTemplateOptions(menuClassification);
          return {
            key: "template_choice",
            adaMessage: "Pick a template style that matches your vision. These are real design templates I'll use as the foundation:",
            options: templateOpts,
            renderAs: "carousel",
          };
        }
        // Non-emenu categories: generic style options (unchanged for now)
        return {
          key: "template_choice",
          adaMessage: "Pick a style direction for your brand:",
          options: [
            { id: "bold", label: "Bold & Vibrant", value: "bold", description: "High-energy, eye-catching" },
            { id: "warm", label: "Warm & Cozy", value: "warm", description: "Earthy tones, inviting feel" },
            { id: "clean", label: "Clean & Minimal", value: "clean", description: "Whitespace, modern elegance" },
            { id: "premium", label: "Premium & Luxury", value: "premium", description: "Dark themes, high-end" },
            { id: "playful", label: "Playful & Fun", value: "playful", description: "Bright, friendly vibe" },
          ],
          renderAs: "carousel",
        };
      }
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
  }, [currentStep, category, isFoodCategory, businessLocation, menuClassification, selectedAssets]);

  const buildConfirmationMessage = useCallback(() => {
    const lines = ["Here's your summary:\n"];
    if (category) lines.push(`• **Category:** ${CATEGORY_CONFIGS[category].label}`);
    if (selectedScope) lines.push(`• **Type:** ${selectedScope}`);
    if (selectedAssets) lines.push(`• **Assets:** ${selectedAssets}`);
    if (selectedSections.length) lines.push(`• **Sections:** ${selectedSections.join(", ")}`);
    if (businessLocation) lines.push(`• **Location:** ${businessLocation}`);
    if (selectedDeliveryApps.length) lines.push(`• **Delivery:** ${selectedDeliveryApps.join(", ")}`);
    if (selectedTemplateKey) lines.push(`• **Template:** ${selectedTemplateKey}`);
    if (userUploadedAssets.logoUrl) lines.push(`• **Logo:** Uploaded ✓`);
    if (userUploadedAssets.brandColors.length) lines.push(`• **Brand Colors:** ${userUploadedAssets.brandColors.join(", ")}`);
    if (userUploadedAssets.images.length) lines.push(`• **Images:** ${userUploadedAssets.images.length} uploaded`);
    lines.push("\nReady to generate?");
    return lines.join("\n");
  }, [category, selectedScope, selectedAssets, selectedSections, selectedDeliveryApps, selectedTemplateKey, businessLocation, userUploadedAssets]);

  const handleGreetingInput = useCallback((text: string) => {
    const detected = detectCategory(text);
    const name = extractBusinessName(text);
    setCategory(detected);
    setBusinessName(name);
    setUserIdea(text);
    classifyOnGreeting(text, detected);
    setCurrentStep("scope");
  }, [classifyOnGreeting]);

  const handleOptionSelect = useCallback((option: StepOption) => {
    switch (currentStep) {
      case "scope":
        setSelectedScope(option.label);
        setCurrentStep("assets");
        break;
      case "assets":
        setSelectedAssets(option.value);
        if (option.value === "user_provided" || option.value === "mix") {
          setCurrentStep("asset_upload");
        } else {
          setCurrentStep("sections");
        }
        break;
      case "sections":
        setSelectedSections(prev =>
          prev.includes(option.value) ? prev.filter(v => v !== option.value) : [...prev, option.value]
        );
        break;
      case "delivery_apps":
        setSelectedDeliveryApps(prev =>
          prev.includes(option.value) ? prev.filter(v => v !== option.value) : [...prev, option.value]
        );
        break;
      case "template_choice":
        setSelectedTemplateKey(option.value);
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
          setCurrentStep("template_choice");
        } else if (option.value === "change_sections") {
          setCurrentStep("sections");
        } else if (option.value === "regenerate") {
          setCurrentStep("generation");
        }
        break;
    }
  }, [currentStep]);

  const handleLocationInput = useCallback((text: string) => {
    setBusinessLocation(text);
    setCurrentStep("delivery_apps");
  }, []);

  const confirmAssetUpload = useCallback(() => {
    setCurrentStep("sections");
  }, []);

  const confirmMultiSelect = useCallback(() => {
    if (currentStep === "sections") {
      if (isFoodCategory) {
        setCurrentStep("business_location");
      } else {
        setCurrentStep("template_choice");
      }
    } else if (currentStep === "delivery_apps") {
      setCurrentStep("template_choice");
    }
  }, [currentStep, isFoodCategory]);

  const resetAll = useCallback(() => {
    setCurrentStep("greeting");
    setCategory(null);
    setSelectedScope(null);
    setSelectedAssets(null);
    setSelectedSections([]);
    setSelectedDeliveryApps([]);
    setSelectedTemplateKey(null);
    setBusinessName("");
    setUserIdea("");
    setIsGenerating(false);
    setGeneratedHtml(null);
    setBusinessLocation("");
    setMenuClassification(null);
    setUserUploadedAssets({ brandColors: [], images: [] });
  }, []);

  const inputAllowed = useMemo(() => {
    return currentStep === "greeting" || currentStep === "refinement" || currentStep === "business_location";
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
    handleLocationInput,
    confirmMultiSelect,
    confirmAssetUpload,
    resetAll,
    inputAllowed,
    selectedScope,
    selectedAssets,
    selectedSections,
    selectedDeliveryApps,
    selectedTemplateKey,
    businessName,
    setBusinessName,
    userIdea,
    setUserIdea,
    isGenerating,
    setIsGenerating,
    generatedHtml,
    setGeneratedHtml,
    isFoodCategory,
    businessLocation,
    setBusinessLocation,
    menuClassification,
    userUploadedAssets,
    setUserUploadedAssets,
    // Kept for backward compat
    selectedStyleCategory: selectedTemplateKey,
    selectedStyleSpecific: null as string | null,
  };
}
