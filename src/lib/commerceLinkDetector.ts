/**
 * Detect and classify commerce-related links.
 * Used across chat, feeds, and anywhere URLs are rendered.
 */

import type { CommerceLinkType } from "@/types/commerce";

// Payment platform patterns
const PAYMENT_PATTERNS = [
  /paypal\.me/i, /stripe\.com\/pay/i, /buy\.stripe\.com/i,
  /cash\.app/i, /venmo\.com/i, /pay\.google\.com/i,
  /mpesa/i, /flutterwave/i, /paystack/i, /mtn.*momo/i,
  /checkout\.link/i, /invoice\.link/i, /ko-fi\.com/i,
  /gumroad\.com\/l\//i, /lemonsqueezy\.com/i,
];

// Product link patterns
const PRODUCT_PATTERNS = [
  /\/(product|item|listing|shop\/product)/i,
  /amazon\.\w+\/dp\//i,
  /ebay\.\w+\/itm\//i,
  /etsy\.com\/listing\//i,
  /shopify\.\w+\/products\//i,
  /aliexpress\.com\/item\//i,
];

// Service link patterns
const SERVICE_PATTERNS = [
  /\/(service|booking|appointment)/i,
  /calendly\.com\//i,
  /fiverr\.com\/s\//i,
  /upwork\.com\/services\//i,
];

// Marketplace patterns
const MARKETPLACE_PATTERNS = [
  /amazon\.\w+/i, /ebay\.\w+/i, /etsy\.com/i,
  /alibaba\.com/i, /aliexpress\.com/i,
  /jumia\.\w+/i, /takealot\.com/i, /kilimall\.com/i,
];

// Internal YANGU platform links
const YANGU_PRODUCT_PATTERN = /\/(product|business|creator|service|project|community)\/[a-zA-Z0-9_-]+/;

export function detectLinkType(url: string): CommerceLinkType {
  if (!url) return 'unknown';

  // Payment links first (most specific)
  if (PAYMENT_PATTERNS.some(p => p.test(url))) return 'payment';

  // Internal YANGU links
  if (url.includes('yangu.') && YANGU_PRODUCT_PATTERN.test(url)) {
    if (/\/product\//i.test(url)) return 'product';
    if (/\/service\//i.test(url)) return 'service';
    return 'product'; // default for other entity pages
  }

  // Product links
  if (PRODUCT_PATTERNS.some(p => p.test(url))) return 'product';

  // Service links
  if (SERVICE_PATTERNS.some(p => p.test(url))) return 'service';

  // Marketplace (generic)
  if (MARKETPLACE_PATTERNS.some(p => p.test(url))) return 'marketplace';

  return 'external';
}

export function getLinkDisplayInfo(type: CommerceLinkType): {
  icon: string;
  label: string;
  bgGradient: string;
  borderColor: string;
} {
  switch (type) {
    case 'payment':
      return {
        icon: '💳',
        label: 'Payment Link',
        bgGradient: 'linear-gradient(135deg, #10b981, #047857)',
        borderColor: 'rgba(16,185,129,0.3)',
      };
    case 'product':
      return {
        icon: '🛍️',
        label: 'View Product',
        bgGradient: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(96,165,250,0.1))',
        borderColor: 'rgba(96,165,250,0.3)',
      };
    case 'service':
      return {
        icon: '🔧',
        label: 'View Service',
        bgGradient: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.1))',
        borderColor: 'rgba(168,85,247,0.3)',
      };
    case 'marketplace':
      return {
        icon: '🏪',
        label: 'View on Marketplace',
        bgGradient: 'linear-gradient(135deg, rgba(251,146,60,0.2), rgba(251,146,60,0.1))',
        borderColor: 'rgba(251,146,60,0.3)',
      };
    default:
      return {
        icon: '🔗',
        label: 'Open Link',
        bgGradient: 'transparent',
        borderColor: 'rgba(255,255,255,0.1)',
      };
  }
}

/**
 * Extract a hostname safely, returning null for invalid URLs.
 */
export function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
