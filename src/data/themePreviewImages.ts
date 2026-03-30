/**
 * Theme preview image mapping — all images served from public/templates/
 * No static imports needed; paths resolve at runtime.
 */

export const THEME_PREVIEW_IMAGES: Record<string, string> = {
  "bold-tech": "/templates/bold-tech.jpg",
  "design-1": "/templates/design-1.jpg",
  "burger": "/templates/burger.jpg",
  "brand": "/templates/brand.jpg",
  "font-post": "/templates/font-post.jpg",
  "good-retro": "/templates/good-retro.jpg",
  "brand-2": "/templates/brand-2.jpg",
  "design-2": "/templates/design-2.jpg",
  "black": "/templates/black.jpg",
  "agency": "/templates/agency.jpg",
  "celebration": "/templates/celebration.jpg",
  "close": "/templates/close.jpg",
  "close-2": "/templates/close-2.jpg",
  "close-3": "/templates/close-3.jpg",
  "coffee": "/templates/coffee.jpg",
  "design-3": "/templates/design-3.jpg",
  "christmas": "/templates/christmas.jpg",
  "diwali": "/templates/diwali.jpg",
  "design-4": "/templates/design-4.jpg",
  "did-you-know": "/templates/did-you-know.jpg",
  "did-you-know-2": "/templates/did-you-know-2.jpg",
  "did-you-know-4": "/templates/did-you-know-4.jpg",
  "easter-1": "/templates/easter-1.jpg",
  "easter-2": "/templates/easter-2.jpg",
  "eid": "/templates/eid.jpg",
  "eid-2": "/templates/eid-2.jpg",
  "eid-3": "/templates/eid-3.jpg",
  "follow-us": "/templates/follow-us.jpg",
  "font": "/templates/font.jpg",
  "food-design": "/templates/food-design.jpg",
  "food-post": "/templates/food-post.jpg",
  "food-burger": "/templates/food-burger.jpg",
  "food-green": "/templates/food-green.jpg",
  "happy-xmas": "/templates/happy-xmas.jpg",
  "easter-3": "/templates/easter-3.jpg",
  "easter-4": "/templates/easter-4.jpg",
  "easter-5": "/templates/easter-5.jpg",
  "health": "/templates/health.jpg",
  "health-2": "/templates/health-2.jpg",
  "health-3": "/templates/health-3.jpg",
  "health-4": "/templates/health-4.jpg",
  "health-5": "/templates/health-5.jpg",
  "ice-cream": "/templates/ice-cream.jpg",
  "yellow-retro": "/templates/yellow-retro.jpg",
  "xmas": "/templates/xmas.jpg",
  "things-to-do": "/templates/things-to-do.jpg",
  "talks": "/templates/talks.jpg",
  "spa": "/templates/spa.jpg",
  "skincare": "/templates/skincare.jpg",
  "skincare-2": "/templates/skincare-2.jpg",
  "skincare-3": "/templates/skincare-3.jpg",
  "social-post": "/templates/social-post.jpg",
  "spa-2": "/templates/spa-2.jpg",
  "love-4": "/templates/love-4.jpg",
  "love-3": "/templates/love-3.jpg",
  "love-2": "/templates/love-2.jpg",
  "marketing": "/templates/marketing.jpg",
  "meat-food": "/templates/meat-food.jpg",
  "party": "/templates/party.jpg",
  "modern-post": "/templates/modern-post.jpg",
  "mens-wear": "/templates/mens-wear.jpg",
  "meme": "/templates/meme.jpg",
  "solutions": "/templates/solutions.jpg",
  "sales": "/templates/sales.jpg",
  "sales-2": "/templates/sales-2.jpg",
  "retro-post": "/templates/retro-post.jpg",
  "pongal": "/templates/pongal.jpg",
  "pongal-2": "/templates/pongal-2.jpg",
  "product": "/templates/product.jpg",
  "restaurant": "/templates/restaurant.jpg",
  "fashion": "/templates/fashion.jpg",
  // Video/GIF templates (thumbnail = first frame or use image fallback)
  "eid-gif": "/templates/eid-gif.mp4",
  "font-gif": "/templates/font-gif.mp4",
  "health-gif": "/templates/health-gif.mp4",
  "illustration-gif": "/templates/illustration-gif.mp4",
  "meme-vid": "/templates/meme-vid.mp4",
  "sales-gif": "/templates/sales-gif.mp4",
  "love-gif": "/templates/love-gif.mp4",
  // Special format
  "font-avif": "/templates/font.avif",
  "retro-rewind": "/templates/retro-rewind.avif",
};

export function getThemePreviewImage(themeKey: string): string | null {
  return THEME_PREVIEW_IMAGES[themeKey] || null;
}

/** Check if a template asset is a video */
export function isVideoTemplate(themeKey: string): boolean {
  const url = THEME_PREVIEW_IMAGES[themeKey];
  return !!url && url.endsWith(".mp4");
}
