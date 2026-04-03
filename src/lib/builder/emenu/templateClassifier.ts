/**
 * Emenu Template Classifier
 * Determines menu complexity (simple vs complex) based on user input,
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
  "restaurant", "fine_dining", "buffet", "catering",
  "bar_lounge", "grill", "fast_food", "delivery_kitchen",
  "takeaway", "pizza",
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
  "fine dining", "full service", "catering", "multiple sections",
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
 * Classify a menu as simple or complex based on available signals.
 */
export function classifyMenuComplexity(input: ClassificationInput): MenuComplexity {
  let simpleScore = 0;
  let complexScore = 0;

  // 1. Business type signal (strongest)
  if (input.businessType) {
    const bt = input.businessType.toLowerCase().replace(/[\s/]+/g, "_");
    if (SIMPLE_BUSINESS_TYPES.has(bt)) simpleScore += 3;
    if (COMPLEX_BUSINESS_TYPES.has(bt)) complexScore += 3;
  }

  // 2. Keyword scan on user idea
  const text = [input.userIdea, input.cuisineType].filter(Boolean).join(" ").toLowerCase();
  for (const kw of SIMPLE_KEYWORDS) {
    if (text.includes(kw)) simpleScore += 1;
  }
  for (const kw of COMPLEX_KEYWORDS) {
    if (text.includes(kw)) complexScore += 1;
  }

  // 3. Estimated item count
  if (input.estimatedItems !== undefined) {
    if (input.estimatedItems <= 15) simpleScore += 2;
    else if (input.estimatedItems > 30) complexScore += 2;
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
];

/**
 * Get the appropriate template keys for a given complexity.
 */
export function getTemplatesForComplexity(complexity: MenuComplexity): string[] {
  const group = EMENU_TEMPLATE_GROUPS.find((g) => g.complexity === complexity);
  return group?.templateKeys ?? ["emenu_visual_a", "emenu_visual_b"];
}
