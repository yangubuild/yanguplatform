/**
 * Emenu Template Classifier
 * Determines menu category (simple_cafe, bigger_menu, or reservation)
 * based on user input, then groups templates accordingly.
 */

import type { MenuComplexity } from "./types";

/** Business types → Simple Food / Café */
const SIMPLE_CAFE_TYPES = new Set([
  "juice_bar", "coffee_shop", "ice_cream", "dessert_shop",
  "bakery", "cafe", "food_truck", "juice", "smoothie",
  "bubble_tea", "tea_shop", "snack_bar", "snack_shop",
  "pastry", "ice_cream_parlor",
]);

/** Business types → Bigger Menu / Multi-Category Food Business */
const BIGGER_MENU_TYPES = new Set([
  "restaurant", "buffet", "catering",
  "bar_lounge", "grill", "fast_food", "delivery_kitchen",
  "takeaway", "pizza", "kitchen", "food_court",
]);

/** Business types → Reservation / Dine-In Experience */
const RESERVATION_TYPES = new Set([
  "fine_dining", "hotel", "hotel_restaurant", "upscale",
  "wine_bar", "tasting_room", "exclusive_dining",
  "lounge", "chefs_table",
]);

/** Keywords → Simple Food / Café */
const SIMPLE_CAFE_KEYWORDS = [
  "juice", "smoothie", "coffee", "tea", "ice cream", "gelato",
  "bakery", "pastry", "cake", "dessert", "snack", "bubble tea",
  "small menu", "few items", "simple", "café", "cafe",
  "ice cream parlor", "pastries",
];

/** Keywords → Bigger Menu / Multi-Category */
const BIGGER_MENU_KEYWORDS = [
  "restaurant", "full menu", "many items", "categories", "large menu",
  "delivery", "ordering", "dine in", "takeaway", "grill", "buffet",
  "full service", "catering", "multiple sections", "kitchen",
  "multi-category", "food business", "hotel food page",
];

/** Keywords → Reservation / Dine-In Experience */
const RESERVATION_KEYWORDS = [
  "reservation", "book a table", "booking", "fine dining",
  "hotel restaurant", "upscale", "exclusive", "tasting menu",
  "dine-in experience", "elegant", "luxury dining", "michelin",
  "gourmet experience", "wine pairing", "private dining",
  "chef's table", "lounge",
];

export interface ClassificationInput {
  /** Industry/business type from wizard selection */
  businessType?: string;
  /** Cuisine type text */
  cuisineType?: string;
  /** Raw user idea text from chat */
  userIdea?: string;
  /** Estimated item count if known */
  estimatedItems?: number;
}

/**
 * Classify a menu into one of three business-friendly categories.
 */
export function classifyMenuComplexity(input: ClassificationInput): MenuComplexity {
  let simpleCafeScore = 0;
  let biggerMenuScore = 0;
  let reservationScore = 0;

  // 1. Business type signal (strongest)
  if (input.businessType) {
    const bt = input.businessType.toLowerCase().replace(/[\s/]+/g, "_");
    if (SIMPLE_CAFE_TYPES.has(bt)) simpleCafeScore += 3;
    if (BIGGER_MENU_TYPES.has(bt)) biggerMenuScore += 3;
    if (RESERVATION_TYPES.has(bt)) reservationScore += 5; // Strong signal
  }

  // 2. Keyword scan on user idea
  const text = [input.userIdea, input.cuisineType].filter(Boolean).join(" ").toLowerCase();
  for (const kw of SIMPLE_CAFE_KEYWORDS) {
    if (text.includes(kw)) simpleCafeScore += 1;
  }
  for (const kw of BIGGER_MENU_KEYWORDS) {
    if (text.includes(kw)) biggerMenuScore += 1;
  }
  for (const kw of RESERVATION_KEYWORDS) {
    if (text.includes(kw)) reservationScore += 2; // Reservation keywords are strong
  }

  // 3. Estimated item count
  if (input.estimatedItems !== undefined) {
    if (input.estimatedItems <= 15) simpleCafeScore += 2;
    else if (input.estimatedItems > 30) biggerMenuScore += 2;
  }

  // Reservation wins if it has the highest score
  if (reservationScore > simpleCafeScore && reservationScore > biggerMenuScore) {
    return "reservation";
  }

  // Default to bigger_menu if tied (more feature-rich)
  return simpleCafeScore > biggerMenuScore ? "simple_cafe" : "bigger_menu";
}

/** Template key grouping */
export interface TemplateGroup {
  complexity: MenuComplexity;
  label: string;
  templateKeys: string[];
}

/** The 4 active non-reservation templates (locked) */
const NON_RESERVATION_TEMPLATE_KEYS = [
  "emenu_plateria",
  "emenu_yumix",
  "emenu_zooom",
  "emenu_visual_a",
];

export const EMENU_TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    complexity: "simple_cafe",
    label: "Simple Food / Café",
    templateKeys: NON_RESERVATION_TEMPLATE_KEYS,
  },
  {
    complexity: "bigger_menu",
    label: "Bigger Menu / Multi-Category",
    templateKeys: NON_RESERVATION_TEMPLATE_KEYS,
  },
  {
    complexity: "reservation",
    label: "Reservation / Dine-In Experience",
    templateKeys: ["emenu_gusto_reservation"],
  },
];

/**
 * Get the appropriate template keys for a given menu category.
 */
export function getTemplatesForComplexity(complexity: MenuComplexity): string[] {
  const group = EMENU_TEMPLATE_GROUPS.find((g) => g.complexity === complexity);
  return group?.templateKeys ?? NON_RESERVATION_TEMPLATE_KEYS;
}
