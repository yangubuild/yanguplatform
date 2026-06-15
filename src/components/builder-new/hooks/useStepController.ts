import { useState, useCallback, useMemo } from "react";
import type { Category } from "../types/builder.types";
import { CATEGORY_CONFIGS } from "../types/builder.types";
import { EMENU_TEMPLATE_GROUPS } from "@/lib/builder/emenu/templateClassifier";
import { classifyEmenu } from "@/lib/builder/emenu/templateFirstGeneration";
import { getTemplate, getTemplatesForEngine } from "@/config/templateRegistry";
import type { MenuComplexity } from "@/lib/builder/emenu/types";
import { categoryFromText as sharedCategoryFromText, type SellChannel } from "@/lib/builder/categoryFromText";
import { getCopy } from "@/components/builder/speak-to-build/copy";

export type BuilderStep =
  | "greeting"
  | "country"
  | "products_services"
  | "payment_methods"
  | "sell_channel"
  | "business_type"
  | "shop_type"
  | "estore_business_model"
  | "estore_supply_type"
  | "estore_product_volume"
  | "estore_moq"
  | "estore_moq_value"
  | "estore_payment_methods"
  | "estore_payment_condition"
  | "estore_quote_requests"
  | "estore_location"
  | "esite_service_type"
  | "esite_key_services"
  | "esite_booking"
  | "esite_booking_email"
  | "esite_payment_methods"
  | "esite_payment_condition"
  | "esite_location"
  | "business_mode"
  | "attributes"
  | "scope"
  | "assets"
  | "asset_upload"
  | "ai_logo"
  | "business_location"
  | "delivery_apps"
  | "template_choice"
  | "confirmation"
  | "generation"
  | "refinement";

// ─── eShop config types ──────────────────────────────────────────────

export type ShopType = "clothing" | "electronics" | "beauty" | "food" | "merch" | "single";
export type BusinessMode = "ordering" | "showcase";

export interface ShopAttributes {
  size: boolean;
  color: boolean;
  volume: boolean;
  weight: boolean;
  variant: boolean;
}

export interface EshopConfig {
  shopType: ShopType | null;
  businessMode: BusinessMode | null;
  attributes: ShopAttributes;
}

const DEFAULT_ATTRIBUTES: ShopAttributes = {
  size: false,
  color: false,
  volume: false,
  weight: false,
  variant: false,
};

const SHOP_TYPE_ATTRIBUTE_MAP: Record<ShopType, Partial<ShopAttributes>> = {
  clothing: { size: true, color: true },
  electronics: { variant: true },
  beauty: { volume: true, variant: true },
  food: { weight: true },
  merch: { variant: true },
  single: { variant: true },
};

const SHOP_TYPE_OPTIONS: StepOption[] = [
  { id: "clothing", label: "Clothing & Fashion", value: "clothing", icon: "👕", description: "Apparel, footwear, accessories" },
  { id: "electronics", label: "Electronics & Devices", value: "electronics", icon: "💻", description: "Phones, gadgets, accessories" },
  { id: "beauty", label: "Beauty & Bottled Products", value: "beauty", icon: "🧴", description: "Skincare, perfumes, cosmetics" },
  { id: "food", label: "Food / Spices / Bulk Goods", value: "food", icon: "🥗", description: "Sold by weight or quantity" },
  { id: "merch", label: "Merchandise / Mixed Products", value: "merch", icon: "🎁", description: "General mixed inventory" },
  { id: "single", label: "Single Product Store", value: "single", icon: "🧩", description: "One hero product" },
];

const BUSINESS_MODE_OPTIONS: StepOption[] = [
  { id: "ordering", label: "Sell Online", value: "ordering", icon: "🛒", description: "Accept orders & checkout" },
  { id: "showcase", label: "Showcase Only", value: "showcase", icon: "🔗", description: "Display products, no checkout" },
];

interface AttributeOption {
  key: keyof ShopAttributes;
  label: string;
  description: string;
}

const ATTRIBUTE_OPTIONS_BY_TYPE: Record<ShopType, AttributeOption[]> = {
  clothing: [
    { key: "size", label: "Sizes", description: "S, M, L, XL, etc." },
    { key: "color", label: "Colors", description: "Color variants per item" },
    { key: "variant", label: "Other Variants", description: "Material, fit, style" },
  ],
  electronics: [
    { key: "variant", label: "Variants", description: "Storage, model, edition" },
    { key: "color", label: "Colors", description: "Color options" },
  ],
  beauty: [
    { key: "volume", label: "Volume", description: "ml / L sizes" },
    { key: "variant", label: "Variants", description: "Scent, type, formula" },
  ],
  food: [
    { key: "weight", label: "Weight", description: "g / kg portions" },
    { key: "variant", label: "Variants", description: "Flavor, type" },
  ],
  merch: [
    { key: "variant", label: "Variants", description: "Generic options" },
    { key: "size", label: "Sizes", description: "If applicable" },
    { key: "color", label: "Colors", description: "If applicable" },
  ],
  single: [
    { key: "variant", label: "Variants", description: "Editions or options" },
  ],
};

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
  categoryContext?: string;
  businessType?: string;
  menuType?: string;
}

type EstoreBusinessModel = "wholesale" | "trading" | "both";
type EstoreSupplyType = "agriculture" | "distribution" | "supermarket" | "hardware" | "industrial" | "bulk_food";
type EstoreProductVolume = "small" | "medium" | "large";
type PaymentCondition = "upfront" | "deposit" | "net_terms" | "on_delivery";
type YesNo = "yes" | "no";

interface EstoreFlowConfig {
  businessModel: EstoreBusinessModel | null;
  supplyType: EstoreSupplyType | null;
  productVolume: EstoreProductVolume | null;
  hasMoq: YesNo | null;
  moqValue: string;
  paymentMethods: string[];
  paymentCondition: PaymentCondition | null;
  quoteRequests: YesNo | null;
  location: string;
}

interface EsiteFlowConfig {
  serviceType: string | null;
  keyServices: string;
  booking: YesNo | null;
  bookingEmail: string;
  paymentMethods: string[];
  paymentCondition: PaymentCondition | null;
  location: string;
}

const ESTORE_BUSINESS_MODEL_OPTIONS: StepOption[] = [
  { id: "wholesale", label: "Wholesale", value: "wholesale", icon: "📦", description: "Bulk supply to retailers, resellers, or businesses" },
  { id: "trading", label: "Trading", value: "trading", icon: "🤝", description: "Sourcing, import/export, or deal-based supply" },
  { id: "both", label: "Both", value: "both", icon: "🔀", description: "Wholesale catalog plus trading enquiries" },
];

const ESTORE_SUPPLY_TYPE_OPTIONS: StepOption[] = [
  { id: "agriculture", label: "Agricultural / Farm Produce", value: "agriculture", icon: "🌾", description: "Fresh produce, farm inputs, crops, or livestock supply" },
  { id: "distribution", label: "Wholesale Distribution", value: "distribution", icon: "🚚", description: "B2B distribution, FMCG, regional supply" },
  { id: "supermarket", label: "Supermarket / Multi-category", value: "supermarket", icon: "🏬", description: "Many product categories and fast-moving goods" },
  { id: "hardware", label: "Hardware & Construction", value: "hardware", icon: "🧱", description: "Materials, tools, fittings, and building supplies" },
  { id: "industrial", label: "Industrial Supplies", value: "industrial", icon: "🏭", description: "Equipment, parts, chemicals, factory supplies" },
  { id: "bulk_food", label: "Bulk Food & Beverages", value: "bulk_food", icon: "🥫", description: "Packaged food, beverages, grains, wholesale pantry" },
];

const ESTORE_PRODUCT_VOLUME_OPTIONS: StepOption[] = [
  { id: "small", label: "Under 50 SKUs", value: "small", icon: "▦", description: "Focused catalog or short product list" },
  { id: "medium", label: "50–500 SKUs", value: "medium", icon: "▦▦", description: "Growing wholesale catalog" },
  { id: "large", label: "500+ SKUs", value: "large", icon: "▦▦▦", description: "Large inventory or many categories" },
];

const YES_NO_OPTIONS: StepOption[] = [
  { id: "yes", label: "Yes", value: "yes", icon: "✓" },
  { id: "no", label: "No", value: "no", icon: "—" },
];

const WHOLESALE_PAYMENT_OPTIONS: StepOption[] = [
  { id: "bank_transfer", label: "Bank Transfer", value: "bank_transfer" },
  { id: "mobile_money", label: "Mobile Money", value: "mobile_money" },
  { id: "cash", label: "Cash", value: "cash" },
  { id: "cards", label: "Cards", value: "cards" },
  { id: "invoice_po", label: "Invoice / PO", value: "invoice_po" },
  { id: "cheque", label: "Cheque", value: "cheque" },
];

const SERVICES_PAYMENT_OPTIONS: StepOption[] = [
  { id: "bank_transfer", label: "Bank Transfer", value: "bank_transfer" },
  { id: "mobile_money", label: "Mobile Money", value: "mobile_money" },
  { id: "cards", label: "Cards", value: "cards" },
  { id: "cash", label: "Cash", value: "cash" },
  { id: "invoice", label: "Invoice", value: "invoice" },
];

const PAYMENT_CONDITION_OPTIONS: StepOption[] = [
  { id: "upfront", label: "Full payment upfront", value: "upfront", icon: "💳", description: "Customer pays before delivery or service starts" },
  { id: "deposit", label: "Deposit first", value: "deposit", icon: "↧", description: "Collect an advance payment, balance later" },
  { id: "net_terms", label: "Invoice terms", value: "net_terms", icon: "📄", description: "Net 7 / 14 / 30 or agreed business terms" },
  { id: "on_delivery", label: "Pay on delivery / completion", value: "on_delivery", icon: "✓", description: "Payment after delivery or service completion" },
];

const ESITE_SERVICE_TYPE_OPTIONS: StepOption[] = [
  { id: "consultancy_agency", label: "Consultancy / Agency", value: "consultancy_agency", icon: "💼", description: "Professional services, advisory, marketing, legal, finance" },
  { id: "real_estate", label: "Real Estate", value: "real_estate", icon: "🏠", description: "Property sales, rentals, developments, brokerage" },
  { id: "travel_tourism", label: "Travel & Tourism", value: "travel_tourism", icon: "🧭", description: "Tours, travel packages, experiences, agencies" },
  { id: "hospitality_hotel", label: "Hospitality / Hotel", value: "hospitality_hotel", icon: "🏨", description: "Hotels, villas, lodges, guest houses, venues" },
  { id: "clinic_wellness", label: "Clinic / Wellness", value: "clinic_wellness", icon: "✚", description: "Health, beauty, wellness, therapy, medical services" },
  { id: "construction", label: "Construction", value: "construction", icon: "🏗️", description: "Contractors, engineering, architecture, project services" },
  { id: "school_education", label: "School / Education", value: "school_education", icon: "🎓", description: "Schools, training centers, education programs" },
  { id: "ngo_institution", label: "NGO / Institution", value: "ngo_institution", icon: "🏛️", description: "Organizations, foundations, institutions, programs" },
];

function getAiLogoContext(
  menuClassification: MenuComplexity | null,
  category: Category | null,
) {
  if (category === "emenu") {
    switch (menuClassification) {
      case "simple_cafe":
        return { category: "cafe", businessType: "simple_cafe", style: "food and beverage", theme: "culinary" };
      case "reservation":
        return { category: "fine_dining", businessType: "reservation", style: "food and beverage", theme: "culinary" };
      case "bigger_menu":
      default:
        return { category: "restaurant", businessType: menuClassification || "restaurant", style: "food and beverage", theme: "culinary" };
    }
  }
  switch (category) {
    case "eshop":
    case "estore":
      return { category: category, businessType: "retail", style: "retail product brand", theme: "commerce and shopping" };
    case "esite":
      return { category: "esite", businessType: "services", style: "professional business", theme: "services and brand" };
    case "influencer":
      return { category: "influencer", businessType: "creator", style: "personal creator brand", theme: "lifestyle and content" };
    case "community":
      return { category: "community", businessType: "community", style: "community group emblem", theme: "collective and belonging" };
    default:
      return { category: "business", businessType: "business", style: "modern business logo", theme: "professional" };
  }
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
  uganda: {
    apps: [
      { id: "glovo", label: "Glovo", value: "glovo" },
      { id: "jumia_food", label: "Jumia Food", value: "jumia_food" },
      { id: "safeboda_food", label: "SafeBoda Food", value: "safeboda_food" },
      { id: "bolt_food", label: "Bolt Food", value: "bolt_food" },
    ],
  },
  kenya: {
    apps: [
      { id: "glovo", label: "Glovo", value: "glovo" },
      { id: "bolt_food", label: "Bolt Food", value: "bolt_food" },
      { id: "jumia_food", label: "Jumia Food", value: "jumia_food" },
      { id: "uber_eats", label: "Uber Eats", value: "ubereats" },
    ],
  },
  nigeria: {
    apps: [
      { id: "glovo", label: "Glovo", value: "glovo" },
      { id: "bolt_food", label: "Bolt Food", value: "bolt_food" },
      { id: "chowdeck", label: "Chowdeck", value: "chowdeck" },
      { id: "jumia_food", label: "Jumia Food", value: "jumia_food" },
    ],
  },
  south_africa: {
    apps: [
      { id: "uber_eats", label: "Uber Eats", value: "ubereats" },
      { id: "mr_d_food", label: "Mr D Food", value: "mr_d_food" },
      { id: "bolt_food", label: "Bolt Food", value: "bolt_food" },
    ],
  },
  tanzania: {
    apps: [
      { id: "glovo", label: "Glovo", value: "glovo" },
      { id: "bolt_food", label: "Bolt Food", value: "bolt_food" },
      { id: "jumia_food", label: "Jumia Food", value: "jumia_food" },
    ],
  },
  ghana: {
    apps: [
      { id: "glovo", label: "Glovo", value: "glovo" },
      { id: "bolt_food", label: "Bolt Food", value: "bolt_food" },
      { id: "jumia_food", label: "Jumia Food", value: "jumia_food" },
    ],
  },
  uk: {
    apps: [
      { id: "deliveroo", label: "Deliveroo", value: "deliveroo" },
      { id: "uber_eats", label: "Uber Eats", value: "ubereats" },
      { id: "just_eat", label: "Just Eat", value: "just_eat" },
    ],
  },
  us: {
    apps: [
      { id: "doordash", label: "DoorDash", value: "doordash" },
      { id: "ubereats", label: "Uber Eats", value: "ubereats" },
      { id: "grubhub", label: "Grubhub", value: "grubhub" },
      { id: "postmates", label: "Postmates", value: "postmates" },
    ],
  },
  india: {
    apps: [
      { id: "swiggy", label: "Swiggy", value: "swiggy" },
      { id: "zomato", label: "Zomato", value: "zomato" },
      { id: "dunzo", label: "Dunzo", value: "dunzo" },
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
  if (lower.includes("uganda") || lower.includes("kampala")) return "uganda";
  if (lower.includes("kenya") || lower.includes("nairobi")) return "kenya";
  if (lower.includes("nigeria") || lower.includes("lagos") || lower.includes("abuja")) return "nigeria";
  if (lower.includes("south africa") || lower.includes("johannesburg") || lower.includes("cape town")) return "south_africa";
  if (lower.includes("tanzania") || lower.includes("dar es salaam")) return "tanzania";
  if (lower.includes("ghana") || lower.includes("accra")) return "ghana";
  if (lower.includes("uk") || lower.includes("london") || lower.includes("united kingdom") || lower.includes("england")) return "uk";
  if (lower.includes("us") || lower.includes("usa") || lower.includes("united states") || lower.includes("new york") || lower.includes("california")) return "us";
  if (lower.includes("india") || lower.includes("mumbai") || lower.includes("delhi") || lower.includes("bangalore")) return "india";
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

// ─── Eshop template options for template_choice step ─────────────────

const ESHOP_TEMPLATE_KEYS = [
  "eshop_aema",
  "eshop_uncover",
  "eshop_kanva",
  "eshop_mockhub",
  "eshop_lumel",
];

function getEshopTemplateOptions(): StepOption[] {
  return ESHOP_TEMPLATE_KEYS.map(key => {
    const preset = getTemplate("eshop", key);
    return {
      id: key,
      label: preset?.label || key,
      value: key,
      description: preset?.description || "",
      icon: preset?.icon || "🛍️",
    };
  });
}

// ─── Estore/Esite template options (sourced from templateRegistry.ts) ──
function getEstoreTemplateOptions(): StepOption[] {
  return getTemplatesForEngine("estore").map((t) => ({
    id: t.key,
    label: t.label,
    value: t.key,
    description: t.description || "",
    icon: t.icon || "🏬",
  }));
}

const ESITE_TEMPLATE_KEYS_BY_SERVICE_TYPE: Record<string, string[]> = {
  consultancy_agency: ["esite_shieldpro", "esite_interim"],
  real_estate: ["esite_realisting", "esite_toplistings"],
  hospitality_hotel: ["esite_luxra", "esite_telvin"],
  travel_tourism: ["esite_tripset", "esite_key"],
  construction: ["esite_estatoo"],
};

function getEsiteTemplateOptions(serviceType?: string | null): StepOption[] {
  const keys = serviceType ? ESITE_TEMPLATE_KEYS_BY_SERVICE_TYPE[serviceType] : undefined;
  const templates = getTemplatesForEngine("esite");
  const scopedTemplates = keys?.length
    ? keys.map((key) => templates.find((t) => t.key === key)).filter(Boolean) as typeof templates
    : templates;
  return scopedTemplates.map((t) => ({
    id: t.key,
    label: t.label,
    value: t.key,
    description: t.description || "",
    icon: t.icon || "🌐",
  }));
}

// ─── User assets state ───────────────────────────────────────────────

export interface UserAssets {
  logoUrl?: string;
  brandColors: string[];
  images: Array<{ url: string; purpose: string }>;
}

// ─── Hook ──────────────────────────────────────────────────────────────

export interface UseStepControllerOptions {
  /**
   * Phase 2 category lock. When provided (e.g. from /seller/:category route),
   * the chat flow MUST NOT silently mutate category. AI suggestions remain
   * advisory only; explicit user confirmation is required to switch.
   */
  lockedCategory?: Category | null;
}

export function useStepController(options: UseStepControllerOptions = {}) {
  const { lockedCategory = null } = options;
  const [currentStep, setCurrentStep] = useState<BuilderStep>("greeting");
  const [category, setCategory] = useState<Category | null>(lockedCategory ?? null);
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
  const [eshopConfig, setEshopConfig] = useState<EshopConfig>({
    shopType: null,
    businessMode: null,
    attributes: { ...DEFAULT_ATTRIBUTES },
  });
  const [estoreConfig, setEstoreConfig] = useState<EstoreFlowConfig>({
    businessModel: null,
    supplyType: null,
    productVolume: null,
    hasMoq: null,
    moqValue: "",
    paymentMethods: [],
    paymentCondition: null,
    quoteRequests: null,
    location: "",
  });
  const [esiteConfig, setEsiteConfig] = useState<EsiteFlowConfig>({
    serviceType: null,
    keyServices: "",
    booking: null,
    bookingEmail: "",
    paymentMethods: [],
    paymentCondition: null,
    location: "",
  });

  // ─── New ADA qualification fields (parity with Speak to Build) ─────
  const [country, setCountry] = useState("");
  const [productsServices, setProductsServices] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [sellChannel, setSellChannel] = useState<SellChannel>("");

  const isFoodCategory = useMemo(() => category === "emenu", [category]);
  const isShopCategory = useMemo(() => category === "eshop", [category]);
  const isEstoreCategory = useMemo(() => category === "estore", [category]);
  const isEsiteCategory = useMemo(() => category === "esite", [category]);

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
      case "greeting":
        if (isEstoreCategory) return "estore_business_model";
        if (isEsiteCategory) return "esite_service_type";
        return "country";
      case "country":         return "products_services";
      case "products_services": return "payment_methods";
      case "payment_methods": return "sell_channel";
      case "sell_channel":
        if (isFoodCategory) return "business_type";
        if (isShopCategory) return "shop_type";
        return "scope";
      case "business_type": return "scope";
      case "shop_type": return "business_mode";
      case "business_mode": return "attributes";
      case "attributes": return "scope";
      case "estore_business_model": return "estore_supply_type";
      case "estore_supply_type": return "estore_product_volume";
      case "estore_product_volume": return "estore_moq";
      case "estore_moq": return estoreConfig.hasMoq === "yes" ? "estore_moq_value" : "estore_payment_methods";
      case "estore_moq_value": return "estore_payment_methods";
      case "estore_payment_methods": return "estore_payment_condition";
      case "estore_payment_condition": return "estore_quote_requests";
      case "estore_quote_requests": return "estore_location";
      case "estore_location": return "assets";
      case "esite_service_type": return "esite_key_services";
      case "esite_key_services": return "esite_booking";
      case "esite_booking": return esiteConfig.booking === "yes" ? "esite_booking_email" : "esite_payment_methods";
      case "esite_booking_email": return "esite_payment_methods";
      case "esite_payment_methods": return "esite_payment_condition";
      case "esite_payment_condition": return "esite_location";
      case "esite_location": return "assets";
      case "scope": return "assets";
      case "assets":
        if (selectedAssets === "ai_generated") return "ai_logo";
        return selectedAssets === "user_provided" || selectedAssets === "mix"
          ? "asset_upload"
          : (isFoodCategory ? "business_location" : "template_choice");
      case "ai_logo": return isFoodCategory ? "business_location" : "template_choice";
      case "asset_upload": return isFoodCategory ? "business_location" : "template_choice";
      case "business_location": return "delivery_apps";
      case "delivery_apps": return "template_choice";
      case "template_choice": return "confirmation";
      case "confirmation": return "generation";
      case "generation": return "refinement";
      default: return "refinement";
    }
  }, [isFoodCategory, isEstoreCategory, isEsiteCategory, selectedAssets, estoreConfig.hasMoq, esiteConfig.booking]);

  const getStepConfig = useCallback((): StepConfig => {
    switch (currentStep) {
      case "greeting":
        return {
          key: "greeting",
          adaMessage: "Hey! 👋 Tell me about your business — what's the name, what do you do, and what are you looking to build?",
          options: [],
          allowFreeText: true,
        };
      case "country":
        return {
          key: "country",
          adaMessage: getCopy("en", "country"),
          options: [],
          allowFreeText: true,
          renderAs: "location_input",
        };
      case "products_services":
        return {
          key: "products_services",
          adaMessage: getCopy("en", "products_services"),
          options: [],
          allowFreeText: true,
          renderAs: "location_input",
        };
      case "payment_methods":
        return {
          key: "payment_methods",
          adaMessage: `${getCopy("en", "payment_methods")} (you can type "skip" if you're not sure yet)`,
          options: [],
          allowFreeText: true,
          renderAs: "location_input",
        };
      case "sell_channel":
        return {
          key: "sell_channel",
          adaMessage: "Where do you plan to sell most?",
          options: [
            { id: "online_store",  label: "Online store",  value: "online_store",  icon: "🛒", description: "Customers buy from your website" },
            { id: "physical_shop", label: "Physical shop", value: "physical_shop", icon: "🏪", description: "In-person sales / dine-in" },
            { id: "both",          label: "Both",          value: "both",          icon: "🔀", description: "Online and physical" },
            { id: "wholesale",     label: "Wholesale",     value: "wholesale",     icon: "📦", description: "B2B / bulk / distribution" },
            { id: "not_sure",      label: "Not sure yet",  value: "not_sure",      icon: "🤔", description: "I'll decide later" },
          ],
          renderAs: "cards",
        };
      case "business_type":
        return {
          key: "business_type",
          adaMessage: `Great, **${businessName}**! What type of food business is this?`,
          options: EMENU_BUSINESS_TYPE_OPTIONS,
          renderAs: "cards",
        };
      case "shop_type":
        return {
          key: "shop_type",
          adaMessage: `Great, **${businessName}**! What type of shop are you creating?`,
          options: SHOP_TYPE_OPTIONS,
          renderAs: "cards",
        };
      case "business_mode":
        return {
          key: "business_mode",
          adaMessage: "How do you want to use your shop?",
          options: BUSINESS_MODE_OPTIONS,
          renderAs: "cards",
        };
      case "attributes": {
        const attrOpts = eshopConfig.shopType
          ? ATTRIBUTE_OPTIONS_BY_TYPE[eshopConfig.shopType]
          : [];
        return {
          key: "attributes",
          adaMessage: "Customize how your products are sold. Toggle what applies, then tap **Done**.",
          options: attrOpts.map(a => ({
            id: a.key,
            label: a.label,
            value: a.key,
            description: a.description,
          })),
          multiSelect: true,
          renderAs: "chips",
        };
      }
      case "estore_business_model":
        return {
          key: "estore_business_model",
          adaMessage: `Great, **${businessName}**. Is this mainly wholesale, trading, or both?`,
          options: ESTORE_BUSINESS_MODEL_OPTIONS,
          renderAs: "cards",
        };
      case "estore_supply_type":
        return {
          key: "estore_supply_type",
          adaMessage: "What type of products do you supply?",
          options: ESTORE_SUPPLY_TYPE_OPTIONS,
          renderAs: "cards",
        };
      case "estore_product_volume":
        return {
          key: "estore_product_volume",
          adaMessage: "How large is your product catalog?",
          options: ESTORE_PRODUCT_VOLUME_OPTIONS,
          renderAs: "cards",
        };
      case "estore_moq":
        return {
          key: "estore_moq",
          adaMessage: "Do you require a minimum order quantity?",
          options: YES_NO_OPTIONS,
          renderAs: "cards",
        };
      case "estore_moq_value":
        return {
          key: "estore_moq_value",
          adaMessage: "What is the minimum order quantity or minimum order value?",
          options: [],
          allowFreeText: true,
          renderAs: "location_input",
        };
      case "estore_payment_methods":
        return {
          key: "estore_payment_methods",
          adaMessage: "Which wholesale payment methods do you accept? Select all that apply, then tap **Done**.",
          options: WHOLESALE_PAYMENT_OPTIONS,
          multiSelect: true,
          renderAs: "chips",
        };
      case "estore_payment_condition":
        return {
          key: "estore_payment_condition",
          adaMessage: "What payment condition do you normally use?",
          options: PAYMENT_CONDITION_OPTIONS,
          renderAs: "cards",
        };
      case "estore_quote_requests":
        return {
          key: "estore_quote_requests",
          adaMessage: "Should buyers be able to request a quote?",
          options: YES_NO_OPTIONS,
          renderAs: "cards",
        };
      case "estore_location":
        return {
          key: "estore_location",
          adaMessage: "Where is your store, warehouse, or main service area based?",
          options: [],
          allowFreeText: true,
          renderAs: "location_input",
        };
      case "esite_service_type":
        return {
          key: "esite_service_type",
          adaMessage: `Great, **${businessName}**. What type of service website are you creating?`,
          options: ESITE_SERVICE_TYPE_OPTIONS,
          renderAs: "cards",
        };
      case "esite_key_services":
        return {
          key: "esite_key_services",
          adaMessage: "What are your key services?",
          options: [],
          allowFreeText: true,
          renderAs: "location_input",
        };
      case "esite_booking":
        return {
          key: "esite_booking",
          adaMessage: "Do you take bookings or consultation requests?",
          options: YES_NO_OPTIONS,
          renderAs: "cards",
        };
      case "esite_booking_email":
        return {
          key: "esite_booking_email",
          adaMessage: "Which email should receive bookings or consultation requests?",
          options: [],
          allowFreeText: true,
          renderAs: "location_input",
        };
      case "esite_payment_methods":
        return {
          key: "esite_payment_methods",
          adaMessage: "Which payment methods do you accept for services? Select all that apply, then tap **Done**.",
          options: SERVICES_PAYMENT_OPTIONS,
          multiSelect: true,
          renderAs: "chips",
        };
      case "esite_payment_condition":
        return {
          key: "esite_payment_condition",
          adaMessage: "How do clients usually pay?",
          options: PAYMENT_CONDITION_OPTIONS,
          renderAs: "cards",
        };
      case "esite_location":
        return {
          key: "esite_location",
          adaMessage: "Where is your business based, or what area do you serve?",
          options: [],
          allowFreeText: true,
          renderAs: "location_input",
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
      case "ai_logo":
        {
          const logoContext = getAiLogoContext(menuClassification, category);
        return {
          key: "ai_logo",
          adaMessage: `I'll generate 3 logo options for **${businessName}**. Pick one you like, or regenerate with a description.`,
          options: [],
          renderAs: "ai_logo",
          categoryContext: logoContext.category,
          businessType: logoContext.businessType,
          menuType: selectedScope || undefined,
        };
        }
      case "asset_upload":
        return {
          key: "asset_upload",
          adaMessage: "Great! Upload your assets below. Add your **logo**, pick your **brand colors**, and upload **images** (menu photos, restaurant interior, team, etc.).\n\nPlease upload at least 3 images.",
          options: [],
          renderAs: "upload",
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
        // Always prefer the locked route category, then fall back to state.
        const effectiveCat = (lockedCategory ?? category) as Category | null;
        // For emenu, show real template previews from the classified pool
        if (effectiveCat === "emenu" && menuClassification) {
          const templateOpts = getEmenuTemplateOptions(menuClassification);
          return {
            key: "template_choice",
            adaMessage: "Pick a template style that matches your vision. These are real design templates I'll use as the foundation:",
            options: templateOpts,
            renderAs: "carousel",
          };
        }
        // For eshop, show the 6 real e-commerce template previews
        if (effectiveCat === "eshop") {
          return {
            key: "template_choice",
            adaMessage: "Pick a template for your shop. These are real e-commerce designs I'll use as the foundation:",
            options: getEshopTemplateOptions(),
            renderAs: "carousel",
          };
        }
        // Esite — service / professional templates from esiteEngine
        if (effectiveCat === "esite") {
          return {
            key: "template_choice",
            adaMessage: "Pick a template for your website. These are real service-site designs I'll use as the foundation:",
            options: getEsiteTemplateOptions(),
            renderAs: "carousel",
          };
        }
        // Estore — wholesale / B2B catalog templates from estoreEngine
        if (effectiveCat === "estore") {
          return {
            key: "template_choice",
            adaMessage: "Pick a template for your store. These are real wholesale / catalog designs I'll use as the foundation:",
            options: getEstoreTemplateOptions(),
            renderAs: "carousel",
          };
        }
        // Other categories: generic style options
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
          adaMessage: "Your website is ready! Use the toolbar to edit directly, or tell me what you'd like to change.",
          options: [
            { id: "change_style", label: "🎨 Change Style", value: "change_style" },
            { id: "edit_sections", label: "📐 Edit Sections", value: "change_sections" },
            { id: "regenerate", label: "🔄 Regenerate", value: "regenerate" },
          ],
          allowFreeText: true,
          renderAs: "chips",
        };
      default:
        return { key: "greeting", adaMessage: "", options: [] };
    }
  }, [currentStep, category, lockedCategory, isFoodCategory, businessLocation, menuClassification, selectedAssets, businessName, selectedScope, eshopConfig.shopType]);

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
    // Locked route category always wins. Otherwise prefer pre-set category
    // over keyword detection. AI detection is advisory only when locked.
    const effective = lockedCategory ?? category ?? detectCategory(text);
    const name = extractBusinessName(text);
    if (!lockedCategory && !category) setCategory(effective);
    setBusinessName(name);
    setUserIdea(text);
    // Spec parity with Speak to Build: ask qualification questions BEFORE
    // branching by category. sell_channel may re-route the category.
    setCurrentStep("country");
  }, [category, lockedCategory]);

  // Free-text handler for the new qualification steps (country / products /
  // payment_methods). Parses lists where appropriate and advances the step.
  const handleQualificationInput = useCallback((text: string) => {
    const trimmed = (text || "").trim();
    switch (currentStep) {
      case "country":
        setCountry(trimmed);
        setCurrentStep("products_services");
        break;
      case "products_services": {
        const items = trimmed
          .split(/[,\n]| and /i)
          .map((s) => s.trim())
          .filter(Boolean);
        setProductsServices(items.length > 0 ? items : (trimmed ? [trimmed] : []));
        setCurrentStep("payment_methods");
        break;
      }
      case "payment_methods": {
        if (/^skip$/i.test(trimmed) || !trimmed) {
          setPaymentMethods([]);
        } else {
          const t = trimmed.toLowerCase();
          const methods: string[] = [];
          if (/\b(all|every|both)\b/.test(t)) {
            methods.push("mobile_money", "cards", "cash", "bank_transfer");
          } else {
            if (/\b(mobile|m-?pesa|mpesa|momo|airtel money|mobile money)\b/.test(t)) methods.push("mobile_money");
            if (/\b(card|visa|mastercard|credit|debit)\b/.test(t)) methods.push("cards");
            if (/\bcash\b/.test(t)) methods.push("cash");
            if (/\b(bank|transfer|wire|iban)\b/.test(t)) methods.push("bank_transfer");
          }
          setPaymentMethods(methods.length > 0 ? methods : [trimmed]);
        }
        setCurrentStep("sell_channel");
        break;
      }
      default:
        break;
    }
  }, [currentStep]);

  const handleOptionSelect = useCallback((option: StepOption) => {
    switch (currentStep) {
      case "business_type":
        setMenuClassification(option.value as MenuComplexity);
        setCurrentStep("scope");
        break;
      case "sell_channel": {
        const channel = option.value as SellChannel;
        setSellChannel(channel);
        // Re-route category only when not locked by route. When locked, the
        // sell channel is recorded but the category never silently mutates.
        let effective: Category;
        if (lockedCategory) {
          effective = lockedCategory;
        } else {
          const routed = sharedCategoryFromText(userIdea || "", channel);
          effective = (routed || category || "esite") as Category;
          if (effective !== category) setCategory(effective);
        }
        if (effective === "emenu") setCurrentStep("business_type");
        else if (effective === "eshop") setCurrentStep("shop_type");
        else setCurrentStep("scope");
        break;
      }
      case "shop_type": {
        const st = option.value as ShopType;
        const preset = SHOP_TYPE_ATTRIBUTE_MAP[st] || {};
        setEshopConfig(prev => ({
          ...prev,
          shopType: st,
          attributes: { ...DEFAULT_ATTRIBUTES, ...preset },
        }));
        setCurrentStep("business_mode");
        break;
      }
      case "business_mode":
        setEshopConfig(prev => ({ ...prev, businessMode: option.value as BusinessMode }));
        setCurrentStep("attributes");
        break;
      case "attributes":
        setEshopConfig(prev => ({
          ...prev,
          attributes: {
            ...prev.attributes,
            [option.value]: !prev.attributes[option.value as keyof ShopAttributes],
          },
        }));
        break;
      case "scope":
        setSelectedScope(option.label);
        setCurrentStep("assets");
        break;
      case "assets":
        setSelectedAssets(option.value);
        if (option.value === "ai_generated") {
          setCurrentStep("ai_logo");
        } else if (option.value === "user_provided" || option.value === "mix") {
          setCurrentStep("asset_upload");
        } else {
          setCurrentStep(isFoodCategory ? "business_location" : "template_choice");
        }
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
        } else if (option.value === "regenerate") {
          setCurrentStep("generation");
        }
        break;
    }
  }, [currentStep, userIdea, category]);

  const handleLocationInput = useCallback((text: string) => {
    setBusinessLocation(text);
    setCurrentStep("delivery_apps");
  }, []);

  const confirmAssetUpload = useCallback(() => {
    setCurrentStep(isFoodCategory ? "business_location" : "template_choice");
  }, [isFoodCategory]);

  const confirmAiLogo = useCallback((logoUrl: string, color?: string) => {
    setUserUploadedAssets(prev => ({
      ...prev,
      logoUrl,
      brandColors: color ? [color, ...prev.brandColors.filter(c => c !== color)] : prev.brandColors,
    }));
    setCurrentStep(isFoodCategory ? "business_location" : "template_choice");
  }, [isFoodCategory]);

  const confirmMultiSelect = useCallback(() => {
    if (currentStep === "delivery_apps") {
      setCurrentStep("template_choice");
    } else if (currentStep === "attributes") {
      setCurrentStep("scope");
    }
  }, [currentStep, isFoodCategory]);

  const resetAll = useCallback(() => {
    setCurrentStep("greeting");
    setCategory(lockedCategory ?? null);
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
    setEshopConfig({ shopType: null, businessMode: null, attributes: { ...DEFAULT_ATTRIBUTES } });
    setCountry("");
    setProductsServices([]);
    setPaymentMethods([]);
    setSellChannel("");
  }, [lockedCategory]);

  const inputAllowed = useMemo(() => {
    return (
      currentStep === "greeting" ||
      currentStep === "refinement" ||
      currentStep === "business_location" ||
      currentStep === "country" ||
      currentStep === "products_services" ||
      currentStep === "payment_methods"
    );
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
    handleQualificationInput,
    confirmMultiSelect,
    confirmAssetUpload,
    confirmAiLogo,
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
    eshopConfig,
    setEshopConfig,
    isShopCategory,
    // ADA qualification parity fields
    country,
    productsServices,
    paymentMethods,
    sellChannel,
    setCountry,
    setProductsServices,
    setPaymentMethods,
    setSellChannel,
    // Kept for backward compat
    selectedStyleCategory: selectedTemplateKey,
    selectedStyleSpecific: null as string | null,
  };
}
