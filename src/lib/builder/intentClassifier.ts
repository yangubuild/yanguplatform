/**
 * AI Intent Classifier — detects user business intent and compares
 * against selected dashboard category.
 */

import type { Category } from "@/components/builder-new/types/builder.types";
import { CATEGORY_CONFIGS } from "@/components/builder-new/types/builder.types";

/** Extended keyword sets beyond CATEGORY_CONFIGS for stronger intent detection */
const EXTENDED_KEYWORDS: Record<Category, string[]> = {
  emenu: ["restaurant", "cafe", "food", "burger", "pizza", "delivery", "menu", "dine", "cuisine", "chicken", "fries", "kitchen", "bakery", "catering", "sushi", "taco", "coffee", "juice", "diner", "grill", "bbq", "dessert", "ice cream"],
  eshop: ["shop", "store", "sell", "buy", "purchase", "products", "retail", "merchandise", "fashion", "clothing", "beauty", "electronics", "ecommerce", "online store", "dropship", "boutique", "accessories"],
  estore: ["wholesale", "trader", "supermarket", "grocery", "agriculture", "farm", "steel", "industrial", "bulk", "distribution", "supply", "hardware", "supplier", "marketplace", "multi-seller", "dealer", "warehouse", "b2b", "distributor", "trade", "inventory"],
  esite: ["service", "services", "real estate", "agency", "consulting", "consultant", "freelance", "freelancer", "tour", "portfolio", "professional", "law", "medical", "booking", "hotel", "hospitality", "travel", "airbnb", "advisor", "salon", "spa", "gym", "clinic", "dentist", "architect", "photographer", "coach", "ngo", "church", "studio"],
  community: ["community", "course", "training", "mentor", "workshop", "webinar", "membership", "members", "group", "ebook", "coaching", "certification", "academy", "school", "class", "tutorial", "forum", "club", "network", "circle", "collective"],
  influencer: ["creator", "streamer", "artist", "musician", "content", "influencer", "youtuber", "tiktoker", "vlogger", "podcast", "blogger", "blog", "social media", "youtube", "instagram", "tiktok", "brand ambassador", "model"],
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

  return `This sounds like a **${detectedLabel}** business, but you're currently in the **${currentLabel}** builder.\n\nFor the best tools and templates, try the **${detectedLabel}** builder instead. Want me to switch you over?`;
}
