/**
 * AI Intent Classifier — detects user business intent and compares
 * against selected dashboard category.
 */

import type { Category } from "@/components/builder-new/types/builder.types";
import { CATEGORY_CONFIGS } from "@/components/builder-new/types/builder.types";

/** Extended keyword sets beyond CATEGORY_CONFIGS for stronger intent detection */
const EXTENDED_KEYWORDS: Record<Category, string[]> = {
  emenu: ["restaurant", "cafe", "food", "burger", "pizza", "delivery", "menu", "chicken", "fries", "kitchen", "bakery", "catering", "sushi", "taco", "coffee", "juice", "diner", "grill", "bbq", "dessert", "ice cream"],
  eshop: ["shop", "store", "sell", "products", "retail", "merchandise", "fashion", "clothing", "ecommerce", "online store", "dropship", "boutique", "accessories"],
  estore: ["wholesale", "trader", "supermarket", "agriculture", "steel", "industrial", "bulk", "distribution", "hardware", "supplier", "marketplace", "multi-seller", "dealer", "warehouse", "b2b", "distributor"],
  esite: ["service", "real estate", "agency", "consulting", "tour", "portfolio", "professional", "law", "medical", "booking", "hotel", "hospitality", "travel", "airbnb", "consultant", "advisor", "salon", "spa", "gym", "fitness", "clinic", "dentist", "architect", "photographer", "freelancer", "coach", "ngo", "church"],
  community: ["community", "course", "training", "mentor", "workshop", "webinar", "event", "membership", "group", "ebook", "coaching", "certification", "academy", "school", "class", "tutorial", "forum"],
  influencer: ["creator", "streamer", "artist", "musician", "content", "influencer", "youtuber", "tiktoker", "vlogger", "podcast", "blogger", "social media", "brand ambassador", "model"],
};

export interface IntentResult {
  detectedCategory: Category;
  confidence: number; // 0-1
  matchedKeywords: string[];
  isMismatch: boolean;
}

/**
 * Classify user intent from their business description text.
 * Returns the detected category and whether it mismatches the current one.
 */
export function classifyUserIntent(
  text: string,
  currentCategory: Category | null
): IntentResult {
  const lower = text.toLowerCase();

  // Score each category by keyword matches
  const scores: { category: Category; score: number; matched: string[] }[] = [];

  for (const cat of Object.keys(EXTENDED_KEYWORDS) as Category[]) {
    const allKeywords = [
      ...EXTENDED_KEYWORDS[cat],
      ...(CATEGORY_CONFIGS[cat]?.keywords || []),
    ];
    const unique = [...new Set(allKeywords)];
    const matched = unique.filter((kw) => lower.includes(kw));
    scores.push({ category: cat, score: matched.length, matched });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];
  const totalKeywordsFound = scores.reduce((s, x) => s + x.score, 0);
  const confidence = totalKeywordsFound > 0 ? best.score / totalKeywordsFound : 0;

  // Default to esite if no keywords matched
  const detected = best.score > 0 ? best.category : "esite";

  return {
    detectedCategory: detected,
    confidence,
    matchedKeywords: best.matched,
    isMismatch: currentCategory !== null && detected !== currentCategory && best.score > 0,
  };
}

/**
 * Generate a user-friendly mismatch warning message.
 */
export function getMismatchMessage(
  currentCategory: Category,
  detectedCategory: Category
): string {
  const currentLabel = CATEGORY_CONFIGS[currentCategory]?.label || currentCategory;
  const detectedLabel = CATEGORY_CONFIGS[detectedCategory]?.label || detectedCategory;

  return `It looks like you're describing a **${detectedLabel}** business, but you started in **${currentLabel}**.\n\nWould you like to switch to ${detectedLabel}? This will give you the right tools and features for your business type.`;
}
