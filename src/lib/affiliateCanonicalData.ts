/**
 * Canonical affiliate data derived from Explore placeholder surfaces.
 * Ensures affiliates use the same inventory as the Explore landing.
 */

import { getAllPlaceholderEntities, getPlaceholdersForSection } from "@/lib/explorePlaceholders";
import type { SearchEntityResult } from "@/types/search";

// Deterministic affiliate metrics seeded from entity properties
function generateMetrics(entity: SearchEntityResult, index: number) {
  const rates = ["15%", "20%", "25%", "30%", "35%", "40%", "50%"];
  const earnings = ["$1k+", "$5k+", "$10k+", "$50k+", "$100k+", "$250k+"];
  const conversions = ["500+", "1,000+", "5,000+", "10,000+"];
  const epcs = ["$0.12", "$0.19", "$0.53", "$1.95", "$2.26", "$2.59", "$4.50", "$8.53"];
  const convRates = ["3.54%", "5.25%", "6.04%", "6.25%", "6.8%", "7.25%", "8.43%", "12.26%"];
  const prices = ["$8.99 / month", "$14.99 / month", "$29.95 / month", "$49.00", "$50.00", "$99.00"];
  const types = ["One-time", "Recurring"];

  const seed = entity.relevance_score + index;
  return {
    commissionRate: rates[seed % rates.length],
    affiliateEarnings: earnings[seed % earnings.length],
    conversions: conversions[seed % conversions.length],
    earningsPerClick: epcs[seed % epcs.length],
    conversionRate: convRates[seed % convRates.length],
    price: prices[seed % prices.length],
    type: types[seed % types.length],
  };
}

export interface AffiliateOffer {
  id: string;
  name: string;
  category: string;
  type: string;
  price: string;
  rate: string;
  sales: string;
  earnings: string;
  conversion: string;
  epc: string;
  image: string;
  avatarUrl: string;
  color: string;
  slug: string;
  industry: string;
}

export interface AffiliateMarketplaceRow {
  id: string;
  company: string;
  avatarUrl: string;
  industryType: string;
  commissionRate: string;
  affiliateEarnings: string;
  conversions: string;
  earningsPerClick: string;
  conversionRate: string;
  isJoined: boolean;
}

const COLORS = ["#e8732a", "#4a90d9", "#6366f1", "#22c55e", "#f59e0b", "#ec4899"];

/** Top 3 hot offers for Refer Buyers, sourced from Trusted Businesses */
export function getHotOffers(): AffiliateOffer[] {
  const trusted = getPlaceholdersForSection("verified");
  return trusted.slice(0, 3).map((entity, i) => {
    const m = generateMetrics(entity, i);
    return {
      id: entity.id,
      name: entity.title,
      category: entity.industry || entity.primary_category || "General",
      type: m.type,
      price: m.price,
      rate: m.commissionRate,
      sales: m.conversions,
      earnings: m.affiliateEarnings,
      conversion: m.conversionRate,
      epc: m.earningsPerClick,
      image: entity.cover_image_url || "",
      avatarUrl: entity.avatar_url || "",
      color: COLORS[i % COLORS.length],
      slug: entity.slug || "",
      industry: entity.industry || entity.primary_category || "",
    };
  });
}

/** Full marketplace table from all 16 canonical surfaces */
export function getMarketplaceListings(): AffiliateMarketplaceRow[] {
  const all = getAllPlaceholderEntities();
  return all.map((entity, i) => {
    const m = generateMetrics(entity, i);
    return {
      id: entity.id,
      company: entity.title,
      avatarUrl: entity.avatar_url || "",
      industryType: entity.industry || entity.primary_category || "General",
      commissionRate: m.commissionRate,
      affiliateEarnings: m.affiliateEarnings,
      conversions: m.conversions,
      earningsPerClick: m.earningsPerClick,
      conversionRate: m.conversionRate,
      isJoined: false,
    };
  });
}
