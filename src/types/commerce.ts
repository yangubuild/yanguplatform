/**
 * Canonical Commerce Object Types for YANGU Platform.
 *
 * Products and Services are first-class platform objects.
 * They render identically across chat, feeds, profiles, discovery, and future shop pages.
 */

// ── Product ──
export interface CommerceProduct {
  id: string;
  title: string;
  description: string | null;
  price_cents: number | null;
  currency: string;
  images: string[];
  owner_id: string;
  owner_name: string | null;
  owner_avatar: string | null;
  category: string | null;
  link: string | null;
  slug: string | null;
  is_verified: boolean;
  metadata?: Record<string, unknown>;
}

// ── Service ──
export type ServicePricingType = 'fixed' | 'custom' | 'inquiry';

export interface CommerceService {
  id: string;
  title: string;
  description: string | null;
  pricing_type: ServicePricingType;
  price_cents: number | null;
  currency: string;
  provider_id: string;
  provider_name: string | null;
  provider_avatar: string | null;
  category: string | null;
  link: string | null;
  slug: string | null;
  is_verified: boolean;
  metadata?: Record<string, unknown>;
}

// ── Unified commerce item (for rendering) ──
export type CommerceItemKind = 'product' | 'service';

export interface CommerceItem {
  kind: CommerceItemKind;
  id: string;
  title: string;
  description: string | null;
  price_label: string | null;
  image_url: string | null;
  owner_name: string | null;
  owner_avatar: string | null;
  category: string | null;
  link: string | null;
  slug: string | null;
  is_verified: boolean;
}

// ── Link type detection ──
export type CommerceLinkType =
  | 'product'
  | 'service'
  | 'payment'
  | 'marketplace'
  | 'external'
  | 'unknown';

// ── Formatting helpers ──
export function formatPriceCents(cents: number | null, currency = 'USD'): string | null {
  if (cents == null) return null;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export function truncateText(text: string | null, max: number): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}
