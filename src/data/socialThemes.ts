/**
 * YANGU Social Media Engine — Template Library
 * All templates sourced from uploaded Drive assets.
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
  category: "poster" | "promo" | "social" | "event" | "general" | "food" | "health" | "fashion" | "holiday";
  /** Whether this is a video/GIF template */
  isVideo?: boolean;
}

export const SYSTEM_THEMES: SocialTheme[] = [
  // — Design & Brand —
  { key: "bold-tech", name: "Bold Tech", templateCount: 1, mood: "futuristic, bold, tech-forward, geometric", colorHint: "electric blue, neon", isSystem: true, category: "poster" },
  { key: "design-1", name: "Design 1", templateCount: 1, mood: "contemporary, sleek, modern layout", colorHint: "neutral + accent", isSystem: true, category: "poster" },
  { key: "design-2", name: "Design 2", templateCount: 1, mood: "creative, structured, design-forward", colorHint: "varied accent", isSystem: true, category: "poster" },
  { key: "design-3", name: "Design 3", templateCount: 1, mood: "artistic, expressive, layout-driven", colorHint: "varied accent colors", isSystem: true, category: "social" },
  { key: "design-4", name: "Design 4", templateCount: 1, mood: "clean, structured, professional", colorHint: "clean, readable", isSystem: true, category: "social" },
  { key: "brand", name: "Brand", templateCount: 1, mood: "brand identity, professional, refined", colorHint: "navy, cream, gold", isSystem: true, category: "poster" },
  { key: "brand-2", name: "Brand 2", templateCount: 1, mood: "typography-heavy, statement, impactful", colorHint: "high contrast", isSystem: true, category: "social" },
  { key: "agency", name: "Agency", templateCount: 1, mood: "elegant, appreciation, sophisticated, agency style", colorHint: "warm neutrals, rose", isSystem: true, category: "social" },
  { key: "marketing", name: "Marketing", templateCount: 1, mood: "digital marketing, agency, professional CTA", colorHint: "orange, white", isSystem: true, category: "promo" },
  { key: "solutions", name: "Solutions", templateCount: 1, mood: "finance, corporate, bold typography", colorHint: "purple, lime, white", isSystem: true, category: "poster" },

  // — Food & Restaurant —
  { key: "burger", name: "Burger", templateCount: 1, mood: "warm, spicy, bold, food promo", colorHint: "orange, red, warm", isSystem: true, category: "food" },
  { key: "food-design", name: "Food Design", templateCount: 1, mood: "food photography, menu design", colorHint: "warm, appetizing", isSystem: true, category: "food" },
  { key: "food-post", name: "Food Post", templateCount: 1, mood: "restaurant social post, food delivery", colorHint: "warm, appetizing tones", isSystem: true, category: "food" },
  { key: "food-burger", name: "Food Burger", templateCount: 1, mood: "burger promo, fast food marketing", colorHint: "red, yellow", isSystem: true, category: "food" },
  { key: "food-green", name: "Food Green", templateCount: 1, mood: "healthy food, salad, organic, fresh", colorHint: "green, fresh, natural", isSystem: true, category: "food" },
  { key: "meat-food", name: "Meat Food", templateCount: 1, mood: "new menu, restaurant, premium food", colorHint: "brown, cream, warm", isSystem: true, category: "food" },
  { key: "ice-cream", name: "Ice Cream", templateCount: 1, mood: "dessert, sweet, colorful, fun", colorHint: "pastel, bright", isSystem: true, category: "food" },
  { key: "restaurant", name: "Restaurant", templateCount: 1, mood: "menu layout, restaurant marketing", colorHint: "dark, red accents", isSystem: true, category: "food" },
  { key: "coffee", name: "Coffee", templateCount: 1, mood: "warm, cozy, café aesthetic, artisanal", colorHint: "brown, cream, warm", isSystem: true, category: "food" },

  // — Typography & Font —
  { key: "font-post", name: "Font Post", templateCount: 1, mood: "typography showcase, font-driven, text art", colorHint: "high contrast", isSystem: true, category: "poster" },
  { key: "font", name: "Font", templateCount: 1, mood: "typography focused, lettering", colorHint: "clean, readable", isSystem: true, category: "social" },

  // — Holiday & Events —
  { key: "christmas", name: "Christmas", templateCount: 1, mood: "holiday, festive, cozy, winter, jolly", colorHint: "red, green, gold", isSystem: true, category: "holiday" },
  { key: "happy-xmas", name: "Happy Xmas", templateCount: 1, mood: "christmas, joyful, seasonal greeting", colorHint: "red, green, gold", isSystem: true, category: "holiday" },
  { key: "xmas", name: "Xmas", templateCount: 1, mood: "christmas, winter, festive decor", colorHint: "red, green, white", isSystem: true, category: "holiday" },
  { key: "diwali", name: "Diwali", templateCount: 1, mood: "celebration, cultural, festive, lights", colorHint: "gold, orange, warm", isSystem: true, category: "holiday" },
  { key: "easter-1", name: "Easter 1", templateCount: 1, mood: "spring, pastel, eggs, floral", colorHint: "pastel yellow, pink", isSystem: true, category: "holiday" },
  { key: "easter-2", name: "Easter 2", templateCount: 1, mood: "easter template, spring celebration", colorHint: "pastel, clean", isSystem: true, category: "holiday" },
  { key: "easter-3", name: "Easter 3", templateCount: 1, mood: "happy easter, festive, decorative", colorHint: "pastel, floral", isSystem: true, category: "holiday" },
  { key: "easter-4", name: "Easter 4", templateCount: 1, mood: "easter eggs, spring, cheerful", colorHint: "pastel, illustrated", isSystem: true, category: "holiday" },
  { key: "easter-5", name: "Easter 5", templateCount: 1, mood: "easter celebration, elegant", colorHint: "pastel, warm", isSystem: true, category: "holiday" },
  { key: "eid", name: "Eid", templateCount: 1, mood: "islamic celebration, cultural, festive", colorHint: "green, gold", isSystem: true, category: "holiday" },
  { key: "eid-2", name: "Eid 2", templateCount: 1, mood: "islamic celebration, festive, community", colorHint: "blue, gold, white", isSystem: true, category: "holiday" },
  { key: "eid-3", name: "Eid 3", templateCount: 1, mood: "eid mubarak, spiritual, festive", colorHint: "green, gold", isSystem: true, category: "holiday" },
  { key: "celebration", name: "Celebration", templateCount: 1, mood: "festive, party, event, joyful", colorHint: "bright, festive", isSystem: true, category: "event" },
  { key: "pongal", name: "Pongal", templateCount: 1, mood: "harvest festival, cultural, traditional", colorHint: "green, orange, gold", isSystem: true, category: "holiday" },
  { key: "pongal-2", name: "Pongal 2", templateCount: 1, mood: "harvest festival, festive, traditional", colorHint: "orange, white", isSystem: true, category: "holiday" },
  { key: "party", name: "Party", templateCount: 1, mood: "night party, event, neon, bold", colorHint: "purple, neon, dark", isSystem: true, category: "event" },

  // — Love & Valentine —
  { key: "love-2", name: "Love 2", templateCount: 1, mood: "valentines, romantic, bold red", colorHint: "red, white", isSystem: true, category: "holiday" },
  { key: "love-3", name: "Love 3", templateCount: 1, mood: "valentines, floral, elegant dark", colorHint: "black, pink, green", isSystem: true, category: "holiday" },
  { key: "love-4", name: "Love 4", templateCount: 1, mood: "valentines, polaroid, romantic", colorHint: "red, pink, warm", isSystem: true, category: "holiday" },

  // — Sales & Promo —
  { key: "sales", name: "Sales", templateCount: 1, mood: "black friday, bold, promotional", colorHint: "yellow, black", isSystem: true, category: "promo" },
  { key: "sales-2", name: "Sales 2", templateCount: 1, mood: "black friday event, dark, urgency", colorHint: "black, red", isSystem: true, category: "promo" },
  { key: "product", name: "Product", templateCount: 1, mood: "product showcase, fragrance, premium", colorHint: "beige, cream, elegant", isSystem: true, category: "promo" },
  { key: "mens-wear", name: "Mens Wear", templateCount: 1, mood: "fashion, hoodie, streetwear, sale", colorHint: "white, black, red accent", isSystem: true, category: "fashion" },

  // — Health & Wellness —
  { key: "health", name: "Health", templateCount: 1, mood: "health tips, wellness, medical", colorHint: "blue, green, clean", isSystem: true, category: "health" },
  { key: "health-2", name: "Health 2", templateCount: 1, mood: "health tips, self-care", colorHint: "clean, medical blue", isSystem: true, category: "health" },
  { key: "health-3", name: "Health 3", templateCount: 1, mood: "wellness, fitness, healthy living", colorHint: "green, blue", isSystem: true, category: "health" },
  { key: "health-4", name: "Health 4", templateCount: 1, mood: "healthcare, medical awareness", colorHint: "blue, white", isSystem: true, category: "health" },
  { key: "health-5", name: "Health 5", templateCount: 1, mood: "health awareness, fitness campaign", colorHint: "blue, green", isSystem: true, category: "health" },
  { key: "spa", name: "Spa", templateCount: 1, mood: "relaxation, wellness, beauty treatment", colorHint: "soft pink, cream", isSystem: true, category: "health" },
  { key: "spa-2", name: "Spa 2", templateCount: 1, mood: "spa treatment, calming, luxury", colorHint: "beige, soft tones", isSystem: true, category: "health" },
  { key: "skincare", name: "Skincare", templateCount: 1, mood: "beauty, skincare routine, clean", colorHint: "soft pink, white", isSystem: true, category: "health" },
  { key: "skincare-2", name: "Skincare 2", templateCount: 1, mood: "beauty products, self-care", colorHint: "pastel, clean", isSystem: true, category: "health" },
  { key: "skincare-3", name: "Skincare 3", templateCount: 1, mood: "beauty routine, cosmetics", colorHint: "soft, feminine", isSystem: true, category: "health" },

  // — Social & Lifestyle —
  { key: "did-you-know", name: "Did You Know", templateCount: 1, mood: "educational, informative, fact-based", colorHint: "clean, readable", isSystem: true, category: "social" },
  { key: "did-you-know-2", name: "Did You Know 2", templateCount: 1, mood: "educational, colorful, engaging", colorHint: "bright primary", isSystem: true, category: "social" },
  { key: "did-you-know-4", name: "Did You Know 4", templateCount: 1, mood: "trivia, informative, engaging", colorHint: "bold, clean", isSystem: true, category: "social" },
  { key: "follow-us", name: "Follow Us", templateCount: 1, mood: "social media CTA, engagement", colorHint: "brand colors, clean", isSystem: true, category: "social" },
  { key: "close", name: "Close", templateCount: 1, mood: "close-up, detail, intimate", colorHint: "warm tones", isSystem: true, category: "social" },
  { key: "close-2", name: "Close 2", templateCount: 1, mood: "compassionate, soft, supportive", colorHint: "warm pink, cream", isSystem: true, category: "social" },
  { key: "close-3", name: "Close 3", templateCount: 1, mood: "sequential, detail, storytelling", colorHint: "consistent brand", isSystem: true, category: "social" },
  { key: "social-post", name: "Social Post", templateCount: 1, mood: "general social media, versatile", colorHint: "varied", isSystem: true, category: "social" },
  { key: "talks", name: "Talks", templateCount: 1, mood: "speaker, event promo, educational", colorHint: "professional, bold", isSystem: true, category: "event" },
  { key: "things-to-do", name: "Things To Do", templateCount: 1, mood: "list, activities, lifestyle tips", colorHint: "varied, bright", isSystem: true, category: "social" },
  { key: "meme", name: "Meme", templateCount: 1, mood: "humorous, relatable, viral, bold text", colorHint: "red, white, bold", isSystem: true, category: "social" },
  { key: "black", name: "Black", templateCount: 1, mood: "dark, bold, premium, minimalist dark", colorHint: "black, white accent", isSystem: true, category: "social" },

  // — Retro —
  { key: "good-retro", name: "Good Retro", templateCount: 1, mood: "vintage, retro aesthetic, nostalgia", colorHint: "muted retro tones", isSystem: true, category: "social" },
  { key: "yellow-retro", name: "Yellow Retro", templateCount: 1, mood: "retro, vintage, warm yellow", colorHint: "yellow, cream", isSystem: true, category: "social" },
  { key: "retro-post", name: "Retro Post", templateCount: 1, mood: "retro festival, music, cartoon style", colorHint: "green, red, yellow", isSystem: true, category: "event" },

  // — Fashion —
  { key: "fashion", name: "Fashion", templateCount: 1, mood: "natural fashion, new arrival, moodboard", colorHint: "beige, brown, neutral", isSystem: true, category: "fashion" },
  { key: "modern-post", name: "Modern Post", templateCount: 1, mood: "music festival, 3D, modern, chrome", colorHint: "pink, gold, dark", isSystem: true, category: "event" },

  // — Video/GIF Templates —
  { key: "eid-gif", name: "Eid GIF", templateCount: 1, mood: "eid celebration, animated, festive", colorHint: "green, gold", isSystem: true, category: "holiday", isVideo: true },
  { key: "font-gif", name: "Font GIF", templateCount: 1, mood: "typography animation, motion text", colorHint: "varied", isSystem: true, category: "social", isVideo: true },
  { key: "health-gif", name: "Health GIF", templateCount: 1, mood: "health tips animation, wellness", colorHint: "blue, green", isSystem: true, category: "health", isVideo: true },
  { key: "illustration-gif", name: "Illustration GIF", templateCount: 1, mood: "illustrated animation, creative", colorHint: "colorful", isSystem: true, category: "social", isVideo: true },
  { key: "meme-vid", name: "Meme Video", templateCount: 1, mood: "meme video, humorous, viral", colorHint: "varied", isSystem: true, category: "social", isVideo: true },
  { key: "sales-gif", name: "Sales GIF", templateCount: 1, mood: "sale animation, promotional motion", colorHint: "bold, red", isSystem: true, category: "promo", isVideo: true },
  { key: "love-gif", name: "Love GIF", templateCount: 1, mood: "valentines animation, romantic motion", colorHint: "red, pink", isSystem: true, category: "holiday", isVideo: true },

  // — Special Format —
  { key: "font-avif", name: "Font AVIF", templateCount: 1, mood: "typography, modern format", colorHint: "varied", isSystem: true, category: "social" },
  { key: "retro-rewind", name: "Retro Rewind", templateCount: 1, mood: "retro event poster, vintage", colorHint: "warm retro", isSystem: true, category: "event" },
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
 * Returns the public path for a selected theme.
 */
export function getRandomTemplateForThemes(selectedThemeKeys: string[]): { themeKey: string; imageUrl: string } | null {
  const imageThemes = SYSTEM_THEMES.filter((t) => !t.isVideo);
  const allKeys = imageThemes.map((t) => t.key);

  const validKeys = selectedThemeKeys.length > 0
    ? selectedThemeKeys.filter((k) => allKeys.includes(k))
    : allKeys;

  const pool = validKeys.length > 0 ? validKeys : allKeys;
  const chosenKey = pool[Math.floor(Math.random() * pool.length)];
  const imageUrl = getThemePreviewImage(chosenKey);

  if (!imageUrl) return null;
  return { themeKey: chosenKey, imageUrl };
}
