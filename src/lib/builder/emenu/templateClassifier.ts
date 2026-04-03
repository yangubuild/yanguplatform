/**
 * Emenu Template Classifier
 * Determines menu complexity (simple, complex, or reservation) based on user input,
 * then groups templates accordingly.
 */

import type { MenuComplexity } from "./types";

/** Business types that typically have simple menus */
const SIMPLE_BUSINESS_TYPES = new Set([
  "juice_bar", "coffee_shop", "ice_cream", "dessert_shop",
  "bakery", "cafe", "food_truck", "juice", "smoothie",
  "bubble_tea", "tea_shop", "snack_bar",
]);

/** Business types that typically have complex menus */
const COMPLEX_BUSINESS_TYPES = new Set([
  "restaurant", "buffet", "catering",
  "bar_lounge", "grill", "fast_food", "delivery_kitchen",
  "takeaway", "pizza",
]);

/** Business types that typically use reservation mode */
const RESERVATION_BUSINESS_TYPES = new Set([
  "fine_dining", "hotel", "hotel_restaurant", "upscale",
  "wine_bar", "tasting_room", "exclusive_dining",
]);

/** Keywords in user input suggesting simple menus */
const SIMPLE_KEYWORDS = [
  "juice", "smoothie", "coffee", "tea", "ice cream", "gelato",
  "bakery", "pastry", "cake", "dessert", "snack", "bubble tea",
  "small menu", "few items", "simple",
];

/** Keywords suggesting complex menus */
const COMPLEX_KEYWORDS = [
  "restaurant", "full menu", "many items", "categories", "large menu",
  "delivery", "ordering", "dine in", "takeaway", "grill", "buffet",
  "full service", "catering", "multiple sections",
];

/** Keywords suggesting reservation mode */
const RESERVATION_KEYWORDS = [
  "reservation", "book a table", "booking", "fine dining",
  "hotel", "upscale", "exclusive", "tasting menu", "dine-in experience",
  "elegant", "luxury dining", "michelin", "gourmet experience",
  "wine pairing", "private dining", "chef's table",
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
 * Classify a menu as simple, complex, or reservation based on available signals.
 */
export function classifyMenuComplexity(input: ClassificationInput): MenuComplexity {
  let simpleScore = 0;
  let complexScore = 0;
  let reservationScore = 0;

  // 1. Business type signal (strongest)
  if (input.businessType) {
    const bt = input.businessType.toLowerCase().replace(/[\s/]+/g, "_");
    if (SIMPLE_BUSINESS_TYPES.has(bt)) simpleScore += 3;
    if (COMPLEX_BUSINESS_TYPES.has(bt)) complexScore += 3;
    if (RESERVATION_BUSINESS_TYPES.has(bt)) reservationScore += 5; // Strong signal
  }

  // 2. Keyword scan on user idea
  const text = [input.userIdea, input.cuisineType].filter(Boolean).join(" ").toLowerCase();
  for (const kw of SIMPLE_KEYWORDS) {
    if (text.includes(kw)) simpleScore += 1;
  }
  for (const kw of COMPLEX_KEYWORDS) {
    if (text.includes(kw)) complexScore += 1;
  }
  for (const kw of RESERVATION_KEYWORDS) {
    if (text.includes(kw)) reservationScore += 2; // Reservation keywords are strong
  }

  // 3. Estimated item count
  if (input.estimatedItems !== undefined) {
    if (input.estimatedItems <= 15) simpleScore += 2;
    else if (input.estimatedItems > 30) complexScore += 2;
  }

  // Reservation wins if it has the highest score
  if (reservationScore > simpleScore && reservationScore > complexScore) {
    return "reservation";
  }

  // Default to complex if tied (more feature-rich)
  return simpleScore > complexScore ? "simple" : "complex";
}

/** Template key grouping */
export interface TemplateGroup {
  complexity: MenuComplexity;
  templateKeys: string[];
}

export const EMENU_TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    complexity: "simple",
    templateKeys: ["emenu_sweet_sips", "emenu_sunday_bite"],
  },
  {
    complexity: "complex",
    templateKeys: ["emenu_visual_a", "emenu_visual_b"],
  },
  {
    complexity: "reservation",
    templateKeys: ["emenu_gusto_reservation"],
  },
];

/**
 * Get the appropriate template keys for a given complexity.
 */
export function getTemplatesForComplexity(complexity: MenuComplexity): string[] {
  const group = EMENU_TEMPLATE_GROUPS.find((g) => g.complexity === complexity);
  return group?.templateKeys ?? ["emenu_visual_a", "emenu_visual_b"];
}
