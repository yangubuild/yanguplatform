import { useEffect } from "react";
import type { CartItem } from "@/lib/cart/cartStore";

type AddToCartInput = Omit<CartItem, "quantity" | "surface_id">;

export interface SavedButtonStyle {
  color?: string;
  borderRadius?: string;
  padding?: string;
  fontSize?: string;
  text?: string;
  visible?: boolean;
}

interface PublicCommerceNormalizerProps {
  surfaceId: string;
  surfaceType?: string;
  currency: string;
  buttonStyle?: SavedButtonStyle | null;
  onAddToCart: (item: AddToCartInput) => void;
  onOpenProductDetail: (product: any) => void;
  onOpenWishlist: () => void;
}

const COMMERCE_SURFACE_TYPES = new Set([
  "eshop",
  "estore",
  "emenu",
  "esite",
  "quick_site",
  "store_listing",
  "live_selling",
  "live_bio",
  "community_group",
  "community",
]);

function normalizeText(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function isPriceText(text: string) {
  const compact = normalizeText(text);
  if (!compact || compact.length > 40) return false;
  // Match both currency-prefix ("$ 7.90", "EUR 7.90") and
  // currency-suffix ("7,90 €", "7.90 EUR") formats used across regions.
  return /(?:[$€£₦]\s*\d|\b(?:UGX|USD|EUR|GBP|KES|TZS|AED|NGN|ZAR|KSh)\s*\d|R\s*\d|\d[\d.,]*\s*(?:[$€£₦]|UGX|USD|EUR|GBP|KES|TZS|AED|NGN|ZAR|KSh))/i.test(compact);
}

function parsePriceCents(text: string) {
  const raw = normalizeText(text)
    .replace(/^(?:[A-Z]{3}|KSh|R)\s*/i, "")
    .replace(/[$€£₦\s,]/g, "");
  const amount = Number.parseFloat(raw);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function getElementText(card: HTMLElement, selectors: string[]) {
  for (const selector of selectors) {
    const el = card.querySelector<HTMLElement>(selector);
    const text = normalizeText(el?.textContent);
    if (text) return text;
  }
  return "";
}

function findPrice(card: HTMLElement) {
  const explicit = getElementText(card, [
    '[data-product-role="price"]',
    ".yangu-product-price",
    ".text-primary",
    '[class*="price"]',
    '[class*="Price"]',
  ]);
  if (isPriceText(explicit)) return explicit;

  const candidates = card.querySelectorAll<HTMLElement>("span, p, div, strong");
  for (const candidate of candidates) {
    const text = normalizeText(candidate.textContent);
    if (isPriceText(text)) return text;
  }
  return explicit;
}

function readProduct(card: HTMLElement, currency: string) {
  const attrName = card.getAttribute("data-yangu-product-name") || card.getAttribute("data-product-title") || card.getAttribute("data-title");
  const attrPrice = card.getAttribute("data-yangu-product-price") || card.getAttribute("data-product-price") || "";
  const name = normalizeText(attrName) || getElementText(card, [
    '[data-product-role="title"]',
    ".yangu-product-name",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "p.truncate",
    "strong",
  ]) || "Product";
  const priceText = normalizeText(attrPrice) || findPrice(card);
  const imageUrl = card.querySelector<HTMLImageElement>("img")?.currentSrc || card.querySelector<HTMLImageElement>("img")?.src || null;
  const priceCents = parsePriceCents(priceText);
  const idSeed = `${name}_${priceCents}_${imageUrl || ""}`;
  const id = btoa(unescape(encodeURIComponent(idSeed))).replace(/=/g, "");
  return { id, name, priceText, priceCents, currency, imageUrl };
}

function findProductContainers(root: ParentNode) {
  const selectors = [
    ".yangu-product-grid",
    '[data-products-grid="true"]',
    '[data-section-type="products"]',
    '[data-section-type="product_grid"]',
    '[data-section-type="menu"]',
    '[data-section-type="listings"]',
    '[data-section-type="listing_grid"]',
    '[data-section-type="featured"]',
    '[class*="product-grid"]',
    '[class*="ProductGrid"]',
    '[class*="products"]',
    '[class*="Products"]',
    '[class*="menu-grid"]',
  ];
  return Array.from(root.querySelectorAll<HTMLElement>(selectors.join(",")));
}

function looksLikeProductCard(el: HTMLElement) {
  if (el.dataset.yanguNormalizedCard === "true") return true;
  if (el.matches('[data-product-card="true"], [data-yangu-product="true"], .yangu-product-card')) return true;
  const hasTitle = !!el.querySelector('[data-product-role="title"], h1, h2, h3, h4, h5, h6, p.truncate, strong');
  const hasPrice = isPriceText(el.textContent || "");
  return hasTitle && hasPrice;
}

/**
 * Document-wide fallback: find every deepest price-bearing element, then walk
 * up to the smallest sensible card boundary. Catches templates whose cards
 * live outside any recognizable product container/grid (the reason some
 * templates showed zero CTAs on desktop).
 */
function findCardsByPriceScan(root: ParentNode, cards: Set<HTMLElement>) {
  const candidates = root.querySelectorAll<HTMLElement>("span, p, div, strong, b, em, h2, h3, h4, h5, h6");
  candidates.forEach((el) => {
    const text = normalizeText(el.textContent);
    if (!text || text.length > 40 || !isPriceText(text)) return;
    // Only the deepest matching element — skip wrappers whose child also matches
    if (Array.from(el.children).some((c) => isPriceText(normalizeText((c as HTMLElement).textContent)))) return;
    // Walk up to find the outermost compact ancestor that looks like a card
    let node: HTMLElement | null = el.parentElement;
    let best: HTMLElement | null = null;
    let depth = 0;
    while (node && depth < 7 && node !== document.body && !node.classList.contains("yangu-public-snapshot")) {
      const totalText = normalizeText(node.textContent);
      if (totalText.length > 600) break; // too big — left the card boundary
      if (looksLikeProductCard(node)) best = node;
      node = node.parentElement;
      depth++;
    }
    if (best) cards.add(best);
  });
}

function findProductCards(root: ParentNode) {
  const cards = new Set<HTMLElement>();
  root.querySelectorAll<HTMLElement>('[data-product-card="true"], [data-yangu-product="true"], .yangu-product-card').forEach((card) => {
    cards.add(card);
  });
  findProductContainers(root).forEach((container) => {
    container.classList.add("yangu-commerce-grid");
    const direct = Array.from(container.children).filter((el): el is HTMLElement => el instanceof HTMLElement);
    direct.forEach((child) => {
      if (looksLikeProductCard(child)) cards.add(child);
    });
    container.querySelectorAll<HTMLElement>("article, li, a, div").forEach((candidate) => {
      if (looksLikeProductCard(candidate) && !Array.from(cards).some((card) => card !== candidate && card.contains(candidate))) {
        cards.add(candidate);
      }
    });
  });
  root.querySelectorAll<HTMLElement>(".yangu-card").forEach((card) => {
    if (looksLikeProductCard(card)) cards.add(card);
  });
  // Global price scan — guarantees every priced card is found on every
  // template, desktop and mobile alike.
  findCardsByPriceScan(root, cards);
  return Array.from(cards).filter((card) => !Array.from(cards).some((other) => other !== card && card.contains(other) && looksLikeProductCard(other)));
}

export function PublicCommerceNormalizer({
  surfaceId,
  surfaceType,
  currency,
  onAddToCart,
  onOpenProductDetail,
  onOpenWishlist,
}: PublicCommerceNormalizerProps) {
  useEffect(() => {
    const type = (surfaceType || "").toLowerCase();
    if (type && !COMMERCE_SURFACE_TYPES.has(type)) return;

    (window as any).__yangu_add_to_cart = onAddToCart;
    (window as any).__yangu_open_wishlist = onOpenWishlist;
    (window as any).__yangu_open_product_detail = onOpenProductDetail;

    const normalize = () => {
      const root = document.querySelector(".yangu-public-snapshot, .yangu-live") || document.body;
      findProductCards(root).forEach((card) => {
        card.dataset.yanguNormalizedCard = "true";
        card.classList.add("yangu-commerce-card");
        card.setAttribute("data-product-card", card.getAttribute("data-product-card") || "true");

        const img = card.querySelector<HTMLImageElement>("img");
        if (img) {
          img.classList.add("yangu-commerce-card-image");
          img.loading = img.loading || "lazy";
        }

        const ctaDisabled = card.getAttribute("data-product-cta") === "none" || card.getAttribute("data-yangu-cta-disabled") === "true";
        const existingCta = card.querySelector<HTMLElement>(".yangu-live-cta, .yangu-cta, [data-yangu-order-btn]");
        if (existingCta) {
          existingCta.classList.add("yangu-live-cta");
          existingCta.setAttribute("data-yangu-commerce-cta", "true");
        } else if (!ctaDisabled) {
          const product = readProduct(card, currency);
          const footer = card.querySelector<HTMLElement>(".yangu-product-footer") || document.createElement("div");
          if (!footer.isConnected) {
            footer.className = "yangu-product-footer";
            footer.setAttribute("data-yangu-injected", "true");
            // Inline styles guarantee the footer is visible even when the
            // template's card uses overflow:hidden or fixed-height children.
            footer.style.cssText =
              "display:flex;flex-direction:column;gap:8px;width:100%;padding:10px 12px 12px;margin-top:auto;";
            card.appendChild(footer);
          }
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = card.getAttribute("data-product-button-text") || "+ Add";
          button.className = "yangu-live-cta";
          button.setAttribute("data-yangu-commerce-cta", "true");
          button.setAttribute("data-yangu-injected-cta", "true");
          button.setAttribute("aria-label", `Add ${product.name} to cart`);
          // Hard-coded inline styles so the CTA renders consistently across
          // every scraped template, regardless of the template's own CSS.
          button.style.cssText =
            "display:flex;align-items:center;justify-content:center;width:100%;min-height:40px;padding:10px 16px;border-radius:8px;background:#111;color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;white-space:nowrap;";
          footer.appendChild(button);
        }
      });
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const cta = target?.closest<HTMLElement>('[data-yangu-commerce-cta="true"], .yangu-live-cta, .yangu-cta, [data-yangu-order-btn]');
      if (!cta) return;
      const card = cta.closest<HTMLElement>('[data-product-card="true"], [data-yangu-normalized-card="true"], .yangu-commerce-card, .yangu-product-card, .yangu-card');
      if (!card || card.getAttribute("data-product-cta") === "none") return;
      event.preventDefault();
      event.stopPropagation();
      const product = readProduct(card, currency);
      onAddToCart({
        id: product.id,
        name: product.name,
        price_cents: product.priceCents,
        currency: product.currency,
        image_url: product.imageUrl,
        variant: null,
      });
      const originalText = cta.textContent || "+ Add";
      cta.textContent = "✓ Added";
      window.setTimeout(() => {
        cta.textContent = originalText;
      }, 1200);
    };

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "yangu_add_to_cart" && data.item) {
        onAddToCart(data.item);
      }
      if (data.type === "yangu_open_cart") {
        (window as any).__yangu_open_cart?.();
      }
      if (data.type === "yangu_open_wishlist") {
        onOpenWishlist();
      }
      if (data.type === "yangu_open_product_detail" && data.product) {
        onOpenProductDetail(data.product);
      }
      if (data.type === "yangu_wishlist_toggle") {
        window.dispatchEvent(new Event("yangu_wishlist_changed"));
      }
    };

    normalize();
    const timers = [250, 1000, 2500].map((ms) => window.setTimeout(normalize, ms));
    const observer = new MutationObserver(() => window.requestAnimationFrame(normalize));
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", handleClick, true);
    window.addEventListener("message", handleMessage);

    return () => {
      timers.forEach(window.clearTimeout);
      observer.disconnect();
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("message", handleMessage);
    };
  }, [currency, onAddToCart, onOpenProductDetail, onOpenWishlist, surfaceId, surfaceType]);

  return null;
}