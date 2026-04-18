/**
 * Surface-aware default button text for product cards.
 * Used by:
 *   - ProductCardEditorModal: pre-fills the button text input
 *   - emenuCartBridge: chooses default label when card has no explicit text
 *
 * Rules:
 *   - Strict 2-word maximum on user-customized button text
 *   - Defaults are editable by the user but never blank
 *
 * Future builders (Estore, Esite, Influencer, Community) automatically inherit
 * by adding their key here.
 */

export type SurfaceCategory =
  | "emenu"
  | "eshop"
  | "estore"
  | "esite"
  | "influencer"
  | "community";

export const PRODUCT_BUTTON_DEFAULTS: Record<SurfaceCategory, string> = {
  emenu: "+ Add",
  eshop: "+ Add",
  estore: "+ Add",
  esite: "Book",
  influencer: "+ Add",
  community: "+ Add",
};

export function getDefaultButtonText(surfaceType?: string): string {
  const key = (surfaceType || "").toLowerCase() as SurfaceCategory;
  return PRODUCT_BUTTON_DEFAULTS[key] || "+ Add";
}

/** Count words in a button label (whitespace-split, trimmed). */
export function countButtonWords(text: string): number {
  const trimmed = (text || "").trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export const MAX_BUTTON_WORDS = 2;

export function isButtonTextValid(text: string): boolean {
  return countButtonWords(text) <= MAX_BUTTON_WORDS;
}
