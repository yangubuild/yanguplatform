/**
 * YANGU Social Media Engine — System Themes
 * Keys use hyphens to match theme preview image asset keys.
 * 
 * TEMPLATE-BASED SYSTEM: Each theme maps to a real template image.
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
  { key: "new-year", name: "New Year", templateCount: 12, mood: "celebratory, festive, fresh start, countdown, sparkling", colorHint: "gold, silver, black", isSystem: true, category: "event" },
  { key: "admire", name: "Admire", templateCount: 14, mood: "elegant, appreciation, warm, sophisticated", colorHint: "warm neutrals, rose", isSystem: true, category: "social" },
  { key: "balance", name: "Balance", templateCount: 10, mood: "harmonious, zen, calm, structured, symmetrical", colorHint: "earth tones, sage", isSystem: true, category: "social" },
  { key: "bloom", name: "Bloom", templateCount: 16, mood: "floral, spring, growth, vibrant, fresh", colorHint: "pink, green, soft pastels", isSystem: true, category: "social" },
  { key: "bold-tech", name: "Bold Tech", templateCount: 11, mood: "futuristic, bold, tech-forward, geometric, neon", colorHint: "electric blue, neon", isSystem: true, category: "poster" },
  { key: "bold-words", name: "Bold Words", templateCount: 15, mood: "typography-heavy, statement, impactful text, editorial", colorHint: "high contrast, monochrome", isSystem: true, category: "social" },
  { key: "border", name: "Border", templateCount: 9, mood: "framed, structured, clean borders, geometric outlines", colorHint: "clean black/white outlines", isSystem: true, category: "social" },
  { key: "bubbles", name: "Bubbles", templateCount: 13, mood: "playful, rounded shapes, soft, friendly, fun", colorHint: "pastel multicolor", isSystem: true, category: "social" },
  { key: "care", name: "Care", templateCount: 10, mood: "compassionate, soft, supportive, warm, nurturing", colorHint: "warm pink, cream", isSystem: true, category: "social" },
  { key: "carousels", name: "Carousels", templateCount: 20, mood: "multi-slide, educational, storytelling, sequential", colorHint: "consistent brand colors", isSystem: true, category: "social" },
  { key: "chapter", name: "Chapter", templateCount: 12, mood: "storytelling, narrative, book-inspired, editorial", colorHint: "cream, ink tones", isSystem: true, category: "social" },
  { key: "christmas", name: "Christmas", templateCount: 18, mood: "holiday, festive, cozy, winter, jolly, seasonal", colorHint: "red, green, gold", isSystem: true, category: "event" },
  { key: "classic", name: "Classic", templateCount: 14, mood: "timeless, traditional, refined, elegant serif", colorHint: "navy, cream, gold", isSystem: true, category: "poster" },
  { key: "coffee", name: "Coffee", templateCount: 11, mood: "warm, cozy, café aesthetic, earthy, artisanal", colorHint: "brown, cream, warm tones", isSystem: true, category: "promo" },
  { key: "cyber", name: "Cyber", templateCount: 8, mood: "digital, neon, dark mode, futuristic, techy", colorHint: "neon green, purple, dark bg", isSystem: true, category: "poster" },
  { key: "dashed", name: "Dashed", templateCount: 7, mood: "hand-drawn feel, dashed lines, sketchy, informal", colorHint: "black dashes, accent colors", isSystem: true, category: "social" },
  { key: "easter", name: "Easter", templateCount: 10, mood: "spring, pastel, eggs, floral, cheerful", colorHint: "pastel yellow, pink, lavender", isSystem: true, category: "event" },
  { key: "elegance", name: "Elegance", templateCount: 10, mood: "luxury, sophisticated, refined, premium, serif fonts", colorHint: "black, gold, cream", isSystem: true, category: "promo" },
  { key: "era", name: "Era", templateCount: 15, mood: "retro, vintage, nostalgic, period-inspired", colorHint: "muted vintage tones", isSystem: true, category: "event" },
  { key: "fonts", name: "Fonts", templateCount: 18, mood: "typography showcase, font-driven, text art, expressive type", colorHint: "high contrast", isSystem: true, category: "poster" },
  { key: "fresh-pop", name: "Fresh Pop", templateCount: 16, mood: "colorful, energetic, pop art, bold, vibrant, youthful", colorHint: "bright primary colors", isSystem: true, category: "social" },
  { key: "influencer", name: "Influencer", templateCount: 13, mood: "personal brand, lifestyle, aspirational, photo-led", colorHint: "warm filters", isSystem: true, category: "social" },
  { key: "influencer-captions", name: "Influencer Captions", templateCount: 8, mood: "caption overlays on photos, personal, authentic", colorHint: "transparent overlays", isSystem: true, category: "social" },
  { key: "interface", name: "Interface", templateCount: 7, mood: "UI-inspired, clean, app-like, modern, structured", colorHint: "clean whites, accent color", isSystem: true, category: "poster" },
  { key: "meme", name: "Meme", templateCount: 25, mood: "humorous, relatable, viral, internet culture, witty", colorHint: "impact font, varied", isSystem: true, category: "social" },
  { key: "minimalist", name: "Minimalist", templateCount: 14, mood: "clean, simple, whitespace, minimal elements, zen", colorHint: "white, single accent", isSystem: true, category: "social" },
  { key: "modern", name: "Modern", templateCount: 11, mood: "contemporary, sleek, current trends, balanced", colorHint: "neutral + accent", isSystem: true, category: "promo" },
  { key: "natural", name: "Natural", templateCount: 21, mood: "organic, earthy, nature-inspired, botanical, green", colorHint: "green, brown, earth tones", isSystem: true, category: "social" },
  { key: "notes", name: "Notes", templateCount: 10, mood: "handwritten, personal, sticky notes, informal, journal", colorHint: "yellow, white, handwriting", isSystem: true, category: "social" },
  { key: "picnic", name: "Picnic", templateCount: 15, mood: "outdoor, checkered, rustic, cheerful, food-friendly", colorHint: "red gingham, green", isSystem: true, category: "social" },
  { key: "plus", name: "Plus", templateCount: 13, mood: "bold plus signs, additive, structured, geometric", colorHint: "bright, structured", isSystem: true, category: "social" },
  { key: "pride", name: "Pride", templateCount: 15, mood: "rainbow, inclusive, celebratory, colorful, pride month", colorHint: "rainbow spectrum", isSystem: true, category: "event" },
  { key: "refine", name: "Refine", templateCount: 8, mood: "polished, upscale, curated, detail-oriented", colorHint: "muted luxury tones", isSystem: true, category: "promo" },
  { key: "save", name: "Save", templateCount: 10, mood: "bookmark-worthy, tips, save this post, educational", colorHint: "clean, readable", isSystem: true, category: "social" },
  { key: "simply-image", name: "Simply Image", templateCount: 1, mood: "photo-only, full bleed image, minimal text overlay", colorHint: "photo-driven", isSystem: true, category: "social" },
  { key: "sleek", name: "Sleek", templateCount: 35, mood: "smooth, premium, glass effect, modern gradients", colorHint: "dark gradients, glass", isSystem: true, category: "poster" },
  { key: "spice", name: "Spice", templateCount: 5, mood: "warm, spicy, bold, flavorful, energetic", colorHint: "orange, red, warm", isSystem: true, category: "promo" },
  { key: "spooky", name: "Spooky", templateCount: 8, mood: "halloween, dark, eerie, playful horror, seasonal", colorHint: "black, orange, purple", isSystem: true, category: "event" },
  { key: "st-patricks", name: "St. Patrick's Day", templateCount: 10, mood: "irish, lucky, green, shamrock, festive", colorHint: "green, gold", isSystem: true, category: "event" },
  { key: "stardust", name: "Stardust", templateCount: 12, mood: "cosmic, sparkly, dreamy, celestial, magical", colorHint: "deep blue, silver, sparkle", isSystem: true, category: "social" },
  { key: "striking", name: "Striking", templateCount: 14, mood: "bold, high impact, dramatic, attention-grabbing", colorHint: "high contrast, bold", isSystem: true, category: "poster" },
  { key: "threads", name: "Threads", templateCount: 9, mood: "thread-style, text-first, conversational, social", colorHint: "clean, minimal", isSystem: true, category: "social" },
  { key: "ticket", name: "Ticket", templateCount: 12, mood: "event ticket style, admission, structured, retro", colorHint: "varied, ticket-shaped", isSystem: true, category: "event" },
  { key: "triad", name: "Triad", templateCount: 23, mood: "three-color harmony, structured, balanced composition", colorHint: "triadic color scheme", isSystem: true, category: "social" },
  { key: "tropical", name: "Tropical", templateCount: 15, mood: "beach, palm trees, summer, exotic, vibrant", colorHint: "teal, coral, tropical", isSystem: true, category: "social" },
  { key: "tweet", name: "Tweet", templateCount: 3, mood: "tweet-style, quote card, social proof, text post", colorHint: "white, blue accent", isSystem: true, category: "social" },
  { key: "voyage", name: "Voyage", templateCount: 10, mood: "travel, adventure, exploration, wanderlust", colorHint: "ocean blue, sandy", isSystem: true, category: "social" },
  { key: "webinar", name: "Webinar", templateCount: 10, mood: "professional, event promo, speaker spotlight, educational", colorHint: "professional, bold CTA", isSystem: true, category: "event" },
  { key: "wilderness", name: "Wilderness", templateCount: 23, mood: "outdoor, rugged, nature, camping, adventure", colorHint: "forest green, brown", isSystem: true, category: "social" },
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
  // Themes that have real uploaded template images (the 7 core templates)
  const CORE_TEMPLATE_KEYS = ["bold-tech", "modern", "spice", "classic", "fonts", "era", "influencer"];
  
  // Filter to themes that have real template images
  const validKeys = selectedThemeKeys.length > 0
    ? selectedThemeKeys.filter((k) => CORE_TEMPLATE_KEYS.includes(k))
    : CORE_TEMPLATE_KEYS;
  
  // If no selected themes have templates, use any core template
  const pool = validKeys.length > 0 ? validKeys : CORE_TEMPLATE_KEYS;
  const chosenKey = pool[Math.floor(Math.random() * pool.length)];
  const imageUrl = getThemePreviewImage(chosenKey);
  
  if (!imageUrl) return null;
  return { themeKey: chosenKey, imageUrl };
}
