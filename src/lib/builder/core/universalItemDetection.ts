/**
 * BuilderCore — Universal Item Detection (Phase 1.1, hybrid approach).
 *
 * Runs at TWO points so editor and published output stay in lock-step:
 *   1. sanitize/publish time — `injectItemAttributesInHtml()` is called from
 *      `editorHtml.ts` before HTML is persisted / published.
 *   2. editor canvas — `injectItemAttributesInDocument()` runs on iframe
 *      `onLoad` so live editing sees the same attribute contract.
 *
 * Contract emitted on every detected item (card-like element):
 *   data-yangu-item               : category key, e.g. "product" | "service" | "listing"
 *   data-yangu-item-id            : stable structural hash (deterministic per render)
 *   data-yangu-item-name          : selector tag (CSS path to the name node)
 *   data-yangu-item-price         : "true" when a price node was identified
 *   data-yangu-item-image         : "true" when an image was identified
 *   data-yangu-item-cta           : "true" when a CTA/button was identified
 *
 * Heuristics are intentionally structural (not visual) to respect the
 * Template Fidelity lock — we never rewrite template markup, only add
 * `data-yangu-item-*` attributes for downstream engines.
 */

import type { BuilderSurfaceType } from "@/types/builder";

/** Map surface type → canonical item key. */
function itemKeyFor(surfaceType?: string): string {
  switch ((surfaceType || "").toLowerCase()) {
    case "emenu": return "product";
    case "eshop": return "product";
    case "store_listing":
    case "estore": return "product";
    case "esite": return "service";
    case "community_listing":
    case "community_group":
    case "community": return "listing";
    case "live_bio":
    case "influencer": return "link";
    case "studio_showcase": return "showcase";
    default: return "product";
  }
}

const CURRENCY_RE = /(?:UGX|USD|EUR|GBP|KES|NGN|ZAR|TZS|GHS|RWF|XAF|XOF|MAD|EGP|AED|SAR|\$|€|£|¥|₦|₵|₨|₹)\s?\d/i;

function looksLikePrice(text: string): boolean {
  if (!text) return false;
  if (text.length > 80) return false;
  return CURRENCY_RE.test(text);
}

function findPriceNode(card: Element): Element | null {
  const explicit = card.querySelector('[data-product-role="price"], [data-yangu-price], .price, [class*="price"]');
  if (explicit) return explicit;
  // Fallback: small text nodes containing currency.
  const candidates = card.querySelectorAll('span, p, div, strong, b');
  for (const el of Array.from(candidates)) {
    const t = (el.textContent || "").trim();
    if (t && looksLikePrice(t)) return el;
  }
  return null;
}

function findNameNode(card: Element, priceNode: Element | null): Element | null {
  const explicit = card.querySelector('[data-product-role="name"], [data-yangu-name]');
  if (explicit) return explicit;
  const headings = card.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headings.length) return headings[0];
  // Heuristic: first meaningful text element that is not the price.
  const candidates = card.querySelectorAll('span, p, div, a');
  for (const el of Array.from(candidates)) {
    if (el === priceNode) continue;
    const t = (el.textContent || "").trim();
    if (t && t.length >= 3 && t.length <= 120 && !looksLikePrice(t)) return el;
  }
  return null;
}

function findCtaNode(card: Element): Element | null {
  return card.querySelector(
    'button, a[href], [role="button"], [data-yangu-commerce-cta], [data-yangu-injected-cta], [data-product-role="cta"]'
  );
}

/** Cheap deterministic hash → stable across renders for the same structure. */
function structuralHash(el: Element): string {
  const parts: string[] = [];
  let cursor: Element | null = el;
  for (let i = 0; i < 6 && cursor; i++) {
    const tag = cursor.tagName.toLowerCase();
    const parent = cursor.parentElement;
    const idx = parent ? Array.from(parent.children).indexOf(cursor) : 0;
    parts.push(`${tag}:${idx}`);
    cursor = parent;
  }
  let h = 5381;
  const s = parts.join("/");
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return "i" + (h >>> 0).toString(36);
}

/**
 * Scan a Document/Element for candidate cards and tag them with
 * data-yangu-item-* attributes.
 * Idempotent — already-tagged cards are skipped.
 */
export function tagItemsInRoot(root: Document | Element, itemKey: string): number {
  let tagged = 0;

  // Pass A: explicitly marked cards (highest trust).
  const explicit = root.querySelectorAll(
    '[data-product-card="true"], [data-yangu-product="true"], .yangu-product-card, .yangu-commerce-card'
  );
  explicit.forEach((card) => {
    if (card.hasAttribute("data-yangu-item")) return;
    const priceNode = findPriceNode(card);
    const nameNode = findNameNode(card, priceNode);
    const ctaNode = findCtaNode(card);
    card.setAttribute("data-yangu-item", itemKey);
    card.setAttribute("data-yangu-item-id", structuralHash(card));
    if (nameNode) card.setAttribute("data-yangu-item-name", "true");
    if (priceNode) card.setAttribute("data-yangu-item-price", "true");
    if (card.querySelector("img, picture, video")) card.setAttribute("data-yangu-item-image", "true");
    if (ctaNode) card.setAttribute("data-yangu-item-cta", "true");
    tagged++;
  });

  // Pass B: structural detection — element containing image + (price or heading).
  // Limit to leaf-ish containers to avoid tagging entire sections.
  const candidates = root.querySelectorAll("article, li, .card, [class*='card'], [class*='Card'], div");
  candidates.forEach((card) => {
    if (!(card instanceof Element)) return;
    if (card.hasAttribute("data-yangu-item")) return;
    const hasImg = !!card.querySelector("img, picture");
    if (!hasImg) return;
    const priceNode = findPriceNode(card);
    const heading = card.querySelector("h1, h2, h3, h4, h5, h6");
    if (!priceNode && !heading) return;
    // Skip if a descendant is already tagged (prefer innermost).
    if (card.querySelector("[data-yangu-item]")) return;
    // Skip if this is a wrapper containing multiple cards.
    const innerImgs = card.querySelectorAll("img, picture");
    if (innerImgs.length > 2) return;
    const nameNode = heading ?? findNameNode(card, priceNode);
    const ctaNode = findCtaNode(card);
    card.setAttribute("data-yangu-item", itemKey);
    card.setAttribute("data-yangu-item-id", structuralHash(card));
    if (nameNode) card.setAttribute("data-yangu-item-name", "true");
    if (priceNode) card.setAttribute("data-yangu-item-price", "true");
    card.setAttribute("data-yangu-item-image", "true");
    if (ctaNode) card.setAttribute("data-yangu-item-cta", "true");
    tagged++;
  });

  return tagged;
}

/**
 * Sanitize/publish-time: parse → tag → serialize.
 * Returns the input HTML unchanged when DOMParser is unavailable (SSR).
 */
export function injectItemAttributesInHtml(
  html: string,
  surfaceType?: BuilderSurfaceType | string,
): string {
  if (!html) return html;
  if (typeof DOMParser === "undefined") return html;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    tagItemsInRoot(doc, itemKeyFor(surfaceType));
    return doc.documentElement.outerHTML;
  } catch {
    return html;
  }
}

/**
 * Editor canvas: tag items inside a live iframe document.
 * Safe to call repeatedly — idempotent.
 */
export function injectItemAttributesInDocument(
  doc: Document | null | undefined,
  surfaceType?: BuilderSurfaceType | string,
): number {
  if (!doc) return 0;
  try {
    return tagItemsInRoot(doc, itemKeyFor(surfaceType));
  } catch {
    return 0;
  }
}

export { itemKeyFor as __itemKeyFor };