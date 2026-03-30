/**
 * YANGU Social Media Engine — Template Library
 * Keys use hyphens to match theme preview image asset keys.
 * 
 * TEMPLATE-BASED SYSTEM: Each theme maps to a real template image from the Drive library.
 * AI edits templates rather than generating from scratch.
 */

import { getThemePreviewImage } from "@/data/themePreviewImages";

export interface SocialTheme {
  key: string;
  name: string;
  templateCount: number;
  mood: string;
  colorHint: string;
  isSystem: boolean;
  /** Category for template selection */
  category: "poster" | "promo" | "social" | "event" | "general";
}

export const SYSTEM_THEMES: SocialTheme[] = [
  { key: "bold-tech", name: "Bold Tech", templateCount: 1, mood: "futuristic, bold, tech-forward, geometric, neon", colorHint: "electric blue, neon", isSystem: true, category: "poster" },
  { key: "modern", name: "Design 1", templateCount: 1, mood: "contemporary, sleek, current trends, balanced", colorHint: "neutral + accent", isSystem: true, category: "promo" },
  { key: "spice", name: "Burger", templateCount: 1, mood: "warm, spicy, bold, flavorful, energetic, food promo", colorHint: "orange, red, warm", isSystem: true, category: "promo" },
  { key: "classic", name: "Brand", templateCount: 1, mood: "timeless, traditional, refined, elegant serif, brand identity", colorHint: "navy, cream, gold", isSystem: true, category: "poster" },
  { key: "fonts", name: "Font Post", templateCount: 1, mood: "typography showcase, font-driven, text art, expressive type", colorHint: "high contrast", isSystem: true, category: "poster" },
  { key: "era", name: "Retro", templateCount: 1, mood: "retro, vintage, nostalgic, period-inspired", colorHint: "muted vintage tones", isSystem: true, category: "event" },
  { key: "influencer", name: "Brand 1", templateCount: 1, mood: "personal brand, lifestyle, aspirational, photo-led", colorHint: "warm filters", isSystem: true, category: "social" },
  { key: "admire", name: "Agency", templateCount: 1, mood: "elegant, appreciation, warm, sophisticated, agency style", colorHint: "warm neutrals, rose", isSystem: true, category: "social" },
  { key: "balance", name: "Black Friday", templateCount: 1, mood: "sale, bold, promotional, urgency, discount", colorHint: "black, gold, red", isSystem: true, category: "promo" },
  { key: "bloom", name: "Black", templateCount: 1, mood: "dark, bold, premium, clean, minimalist dark", colorHint: "black, white accent", isSystem: true, category: "social" },
  { key: "bold-words", name: "Brand 2", templateCount: 1, mood: "typography-heavy, statement, impactful text, brand identity", colorHint: "high contrast, monochrome", isSystem: true, category: "social" },
  { key: "border", name: "Celebration", templateCount: 1, mood: "festive, party, event, joyful, celebratory", colorHint: "bright, festive colors", isSystem: true, category: "event" },
  { key: "bubbles", name: "Close", templateCount: 1, mood: "close-up, detail, intimate, personal", colorHint: "warm tones", isSystem: true, category: "social" },
  { key: "care", name: "Close 2", templateCount: 1, mood: "compassionate, soft, supportive, warm, close perspective", colorHint: "warm pink, cream", isSystem: true, category: "social" },
  { key: "carousels", name: "Close 3", templateCount: 1, mood: "sequential, multi-slide, close detail, storytelling", colorHint: "consistent brand colors", isSystem: true, category: "social" },
  { key: "chapter", name: "Coffee", templateCount: 1, mood: "warm, cozy, café aesthetic, earthy, artisanal", colorHint: "brown, cream, warm tones", isSystem: true, category: "social" },
  { key: "christmas", name: "Christmas", templateCount: 1, mood: "holiday, festive, cozy, winter, jolly, seasonal", colorHint: "red, green, gold", isSystem: true, category: "event" },
  { key: "coffee", name: "Dawali", templateCount: 1, mood: "celebration, cultural, festive, lights, spiritual", colorHint: "gold, orange, warm", isSystem: true, category: "event" },
  { key: "cyber", name: "Design 2", templateCount: 1, mood: "digital, modern, creative, structured", colorHint: "neon green, purple, dark bg", isSystem: true, category: "poster" },
  { key: "dashed", name: "Design 3", templateCount: 1, mood: "creative, artistic, design-forward, expressive", colorHint: "varied accent colors", isSystem: true, category: "social" },
  { key: "easter", name: "Design 4", templateCount: 1, mood: "clean, structured, professional design layout", colorHint: "pastel, clean", isSystem: true, category: "social" },
  { key: "elegance", name: "Did You Know", templateCount: 1, mood: "educational, informative, fact-based, engaging", colorHint: "clean, readable", isSystem: true, category: "social" },
  { key: "fresh-pop", name: "Did You Know 2", templateCount: 1, mood: "educational, colorful, engaging facts", colorHint: "bright primary colors", isSystem: true, category: "social" },
  { key: "influencer-captions", name: "Easter", templateCount: 1, mood: "spring, pastel, eggs, floral, cheerful", colorHint: "pastel yellow, pink, lavender", isSystem: true, category: "event" },
  { key: "interface", name: "Eid", templateCount: 1, mood: "islamic celebration, cultural, festive, spiritual", colorHint: "green, gold", isSystem: true, category: "event" },
  { key: "meme", name: "Eid 2", templateCount: 1, mood: "islamic celebration, festive, community, spiritual", colorHint: "blue, gold, white", isSystem: true, category: "event" },
  { key: "minimalist", name: "Follow Us", templateCount: 1, mood: "social media CTA, engagement, follower growth", colorHint: "brand colors, clean", isSystem: true, category: "social" },
  { key: "natural", name: "Font", templateCount: 1, mood: "typography focused, lettering, type design", colorHint: "clean, readable", isSystem: true, category: "social" },
  { key: "new-year", name: "Food Design", templateCount: 1, mood: "food photography, menu design, restaurant promo", colorHint: "warm, appetizing", isSystem: true, category: "promo" },
  { key: "notes", name: "Food Post", templateCount: 1, mood: "restaurant social post, food delivery, meal promo", colorHint: "warm, appetizing tones", isSystem: true, category: "promo" },
  { key: "picnic", name: "Food Burger", templateCount: 1, mood: "burger promo, fast food, restaurant marketing", colorHint: "red, yellow, appetizing", isSystem: true, category: "promo" },
  { key: "plus", name: "Food Green", templateCount: 1, mood: "healthy food, salad, organic, fresh, green", colorHint: "green, fresh, natural", isSystem: true, category: "promo" },
  { key: "pride", name: "Good Retro", templateCount: 1, mood: "vintage, retro aesthetic, nostalgia, throwback", colorHint: "muted retro tones", isSystem: true, category: "social" },
  { key: "refine", name: "Happy Xmas", templateCount: 1, mood: "christmas, joyful, seasonal, holiday greeting", colorHint: "red, green, gold", isSystem: true, category: "event" },
  { key: "save", name: "Health 2", templateCount: 1, mood: "health tips, wellness, medical, self-care", colorHint: "clean, medical blue, green", isSystem: true, category: "social" },
  { key: "simply-image", name: "Health 5", templateCount: 1, mood: "health awareness, fitness, wellness campaign", colorHint: "blue, green, clean", isSystem: true, category: "social" },
  { key: "sleek", name: "Sleek", templateCount: 1, mood: "smooth, premium, glass effect, modern gradients", colorHint: "dark gradients, glass", isSystem: true, category: "poster" },
  { key: "spooky", name: "Spooky", templateCount: 1, mood: "halloween, dark, eerie, playful horror, seasonal", colorHint: "black, orange, purple", isSystem: true, category: "event" },
  { key: "st-patricks", name: "St. Patrick's", templateCount: 1, mood: "irish, lucky, green, shamrock, festive", colorHint: "green, gold", isSystem: true, category: "event" },
  { key: "stardust", name: "Stardust", templateCount: 1, mood: "cosmic, sparkly, dreamy, celestial, magical", colorHint: "deep blue, silver, sparkle", isSystem: true, category: "social" },
  { key: "striking", name: "Striking", templateCount: 1, mood: "bold, high impact, dramatic, attention-grabbing", colorHint: "high contrast, bold", isSystem: true, category: "poster" },
  { key: "threads", name: "Threads", templateCount: 1, mood: "thread-style, text-first, conversational, social", colorHint: "clean, minimal", isSystem: true, category: "social" },
  { key: "ticket", name: "Ticket", templateCount: 1, mood: "event ticket style, admission, structured, retro", colorHint: "varied, ticket-shaped", isSystem: true, category: "event" },
  { key: "triad", name: "Triad", templateCount: 1, mood: "three-color harmony, structured, balanced composition", colorHint: "triadic color scheme", isSystem: true, category: "social" },
  { key: "tropical", name: "Tropical", templateCount: 1, mood: "beach, palm trees, summer, exotic, vibrant", colorHint: "teal, coral, tropical", isSystem: true, category: "social" },
  { key: "tweet", name: "Tweet", templateCount: 1, mood: "tweet-style, quote card, social proof, text post", colorHint: "white, blue accent", isSystem: true, category: "social" },
  { key: "voyage", name: "Voyage", templateCount: 1, mood: "travel, adventure, exploration, wanderlust", colorHint: "ocean blue, sandy", isSystem: true, category: "social" },
  { key: "webinar", name: "Webinar", templateCount: 1, mood: "professional, event promo, speaker spotlight, educational", colorHint: "professional, bold CTA", isSystem: true, category: "event" },
  { key: "wilderness", name: "Wilderness", templateCount: 1, mood: "outdoor, rugged, nature, camping, adventure", colorHint: "forest green, brown", isSystem: true, category: "social" },
];

export function getThemeByKey(key: string): SocialTheme | undefined {
  return SYSTEM_THEMES.find((t) => t.key === key);
}

/** Build AI image prompt context from selected themes */
export function buildThemePromptContext(selectedThemeKeys: string[]): string {
  if (!selectedThemeKeys.length) return "";
  const themes = selectedThemeKeys
    .map(getThemeByKey)
    .filter(Boolean) as SocialTheme[];
  if (!themes.length) return "";
  const theme = themes[Math.floor(Math.random() * themes.length)];
  return `Design style direction: "${theme.name}" theme — ${theme.mood}. Color direction: ${theme.colorHint}.`;
}

/**
 * Get a random template image URL for generation.
 * Returns the imported asset path for a selected theme.
 */
export function getRandomTemplateForThemes(selectedThemeKeys: string[]): { themeKey: string; imageUrl: string } | null {
  // All themes now map to real template images
  const allKeys = SYSTEM_THEMES.map((t) => t.key);
  
  // Filter to themes that have real template images
  const validKeys = selectedThemeKeys.length > 0
    ? selectedThemeKeys.filter((k) => allKeys.includes(k))
    : allKeys;
  
  const pool = validKeys.length > 0 ? validKeys : allKeys;
  const chosenKey = pool[Math.floor(Math.random() * pool.length)];
  const imageUrl = getThemePreviewImage(chosenKey);
  
  if (!imageUrl) return null;
  return { themeKey: chosenKey, imageUrl };
}
