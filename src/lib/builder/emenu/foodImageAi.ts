/**
 * Emenu AI Food Image Generation
 * Uses Lovable AI (Nano banana) to generate food images.
 */

import { FOOD_CATEGORY_PLACEHOLDERS } from "./types";

/**
 * Build an AI prompt for generating a food item image.
 */
export function buildFoodImagePrompt(
  dishName: string,
  cuisineType?: string,
  category?: string,
): string {
  const cuisine = cuisineType ? ` ${cuisineType} cuisine` : "";
  const cat = category ? ` from the ${category} category` : "";
  return `Professional food photography of "${dishName}"${cuisine}${cat}. Top-down angle on a clean plate, warm lighting, appetizing presentation, restaurant quality, shallow depth of field. No text, no watermarks.`;
}

/**
 * Get the emoji placeholder for a food category.
 */
export function getFoodCategoryPlaceholder(categoryName: string): string {
  const normalized = categoryName.toLowerCase().replace(/[\s/&]+/g, "_");
  // Try exact match first, then partial
  if (FOOD_CATEGORY_PLACEHOLDERS[normalized]) {
    return FOOD_CATEGORY_PLACEHOLDERS[normalized];
  }
  for (const [key, emoji] of Object.entries(FOOD_CATEGORY_PLACEHOLDERS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return emoji;
    }
  }
  return FOOD_CATEGORY_PLACEHOLDERS.default;
}

/**
 * Generate a food image using the Lovable AI gateway.
 * Returns base64 data URL or null on failure.
 */
export async function generateFoodImage(
  dishName: string,
  cuisineType?: string,
  category?: string,
): Promise<string | null> {
  try {
    const prompt = buildFoodImagePrompt(dishName, cuisineType, category);
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    return imageUrl || null;
  } catch {
    return null;
  }
}
