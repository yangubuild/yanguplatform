/**
 * Explore Bootstrap Placeholder Surfaces
 *
 * 16 curated placeholder surfaces that fill the Explore landing
 * when live user inventory is low (bootstrap phase).
 *
 * These behave like real SearchEntityResult objects and are consumed
 * by the existing rotation / ranking pipeline unchanged.
 *
 * Cover images are bundled assets imported via ES6 modules.
 */

import type { SearchEntityResult } from "@/types/search";

// ── Cover image imports ──
import paymintAfrica from "@/assets/placeholders/paymint-africa.jpg";
import coastrideExperiences from "@/assets/placeholders/coastride-experiences.png";
import urbandriveMotors from "@/assets/placeholders/urbandrive-motors.jpg";
import heritageCircleAfrica from "@/assets/placeholders/heritage-circle-africa.jpg";
import genfuelDrinks from "@/assets/placeholders/genfuel-drinks.jpg";
import novatechStore from "@/assets/placeholders/novatech-store.jpg";
import kitengeMode from "@/assets/placeholders/kitenge-mode.jpg";
import coreformStudio from "@/assets/placeholders/coreform-studio.jpg";
import crunchhouseKitchen from "@/assets/placeholders/crunchhouse-kitchen.jpg";
import civiclawAdvisory from "@/assets/placeholders/civiclaw-advisory.jpg";
import kayaProperties from "@/assets/placeholders/kaya-properties.jpg";
import freshcutzBarbers from "@/assets/placeholders/freshcutz-barbers.jpg";
import solevaultSneakers from "@/assets/placeholders/solevault-sneakers.jpg";
import glowlabBeauty from "@/assets/placeholders/glowlab-beauty.jpg";
import novalimitSoftware from "@/assets/placeholders/novalimit-software.jpg";
import skyboundTravels from "@/assets/placeholders/skybound-travels.jpg";

// ── Identity type (metadata only — not part of SearchEntityResult) ──
export type PlaceholderIdentity = "person" | "brand" | "mixed";

export interface PlaceholderSurface {
  entity: SearchEntityResult;
  identity: PlaceholderIdentity;
  /** Which Explore section this placeholder prefers */
  preferredSection: "verified" | "products" | "services" | "community" | "popular";
}

// ── Deterministic IDs for placeholder surfaces ──
function pid(n: number): string {
  return `placeholder-${String(n).padStart(3, "0")}`;
}

// ── All 16 placeholder surfaces ──

const ALL_PLACEHOLDERS: PlaceholderSurface[] = [
  // 1. PayMint Africa — Trusted Businesses
  {
    entity: {
      id: pid(1),
      entity_type: "business",
      entity_subtype: "general",
      title: "PayMint Africa",
      short_description: "Smart payments, digital wallets, and borderless money tools for modern businesses.",
      primary_category: "fintech",
      tags: ["payments", "fintech", "digital-wallet"],
      visibility_tier: "verified",
      is_verified: true,
      domain_host: null,
      slug: "paymint-africa",
      industry: "Financial Technology",
      surface_type: "quick_site",
      cover_image_url: paymintAfrica,
      published_at: "2025-12-01T00:00:00Z",
      relevance_score: 85,
      trust_score: 70,
    },
    identity: "brand",
    preferredSection: "verified",
  },
  // 2. CoastRide Experiences — Find Services
  {
    entity: {
      id: pid(2),
      entity_type: "service",
      entity_subtype: "general",
      title: "CoastRide Experiences",
      short_description: "Curated beach rides, lifestyle escapes, and premium local experiences.",
      primary_category: "lifestyle",
      tags: ["experiences", "beach", "cycling", "lifestyle"],
      visibility_tier: "free",
      is_verified: false,
      domain_host: null,
      slug: "coastride-experiences",
      industry: "Lifestyle & Recreation",
      surface_type: "quick_site",
      cover_image_url: coastrideExperiences,
      published_at: "2025-11-15T00:00:00Z",
      relevance_score: 72,
      trust_score: 45,
    },
    identity: "person",
    preferredSection: "services",
  },
  // 3. UrbanDrive Motors — Buy From
  {
    entity: {
      id: pid(3),
      entity_type: "business",
      entity_subtype: "general",
      title: "UrbanDrive Motors",
      short_description: "New mobility deals, premium cars, and trusted vehicle sourcing.",
      primary_category: "shop",
      tags: ["cars", "automotive", "dealership"],
      visibility_tier: "verified",
      is_verified: true,
      domain_host: null,
      slug: "urbandrive-motors",
      industry: "Automotive",
      surface_type: "eshop",
      cover_image_url: urbandriveMotors,
      published_at: "2025-10-20T00:00:00Z",
      relevance_score: 80,
      trust_score: 65,
    },
    identity: "brand",
    preferredSection: "products",
  },
  // 4. Heritage Circle Africa — Join Communities
  {
    entity: {
      id: pid(4),
      entity_type: "community",
      entity_subtype: "general",
      title: "Heritage Circle Africa",
      short_description: "Celebrating culture, identity, and African creative communities.",
      primary_category: "culture",
      tags: ["culture", "heritage", "african", "community"],
      visibility_tier: "free",
      is_verified: false,
      domain_host: null,
      slug: "heritage-circle-africa",
      industry: "Culture & Heritage",
      surface_type: "community_group",
      cover_image_url: heritageCircleAfrica,
      published_at: "2025-11-01T00:00:00Z",
      relevance_score: 75,
      trust_score: 50,
    },
    identity: "mixed",
    preferredSection: "community",
  },
  // 5. GenFuel Drinks — Buy From
  {
    entity: {
      id: pid(5),
      entity_type: "business",
      entity_subtype: "general",
      title: "GenFuel Drinks",
      short_description: "Youth culture beverages built around energy, sport, and trend.",
      primary_category: "shop",
      tags: ["beverages", "energy-drinks", "youth"],
      visibility_tier: "free",
      is_verified: false,
      domain_host: null,
      slug: "genfuel-drinks",
      industry: "Food & Beverage",
      surface_type: "eshop",
      cover_image_url: genfuelDrinks,
      published_at: "2025-09-10T00:00:00Z",
      relevance_score: 68,
      trust_score: 40,
    },
    identity: "brand",
    preferredSection: "popular",
  },
  // 6. NovaTech Store — Buy From
  {
    entity: {
      id: pid(6),
      entity_type: "business",
      entity_subtype: "general",
      title: "NovaTech Store",
      short_description: "Smart gadgets, electronics, and premium digital accessories.",
      primary_category: "shop",
      tags: ["electronics", "gadgets", "tech"],
      visibility_tier: "verified",
      is_verified: true,
      domain_host: null,
      slug: "novatech-store",
      industry: "Electronics",
      surface_type: "eshop",
      cover_image_url: novatechStore,
      published_at: "2025-10-05T00:00:00Z",
      relevance_score: 82,
      trust_score: 68,
    },
    identity: "brand",
    preferredSection: "products",
  },
  // 7. Kitenge Mode — Buy From
  {
    entity: {
      id: pid(7),
      entity_type: "business",
      entity_subtype: "general",
      title: "Kitenge Mode",
      short_description: "Modern African fashion, textile identity, and wearable culture.",
      primary_category: "shop",
      tags: ["fashion", "african-fashion", "kitenge", "textiles"],
      visibility_tier: "free",
      is_verified: false,
      domain_host: null,
      slug: "kitenge-mode",
      industry: "Fashion & Apparel",
      surface_type: "eshop",
      cover_image_url: kitengeMode,
      published_at: "2025-08-20T00:00:00Z",
      relevance_score: 70,
      trust_score: 42,
    },
    identity: "mixed",
    preferredSection: "popular",
  },
  // 8. CoreForm Studio — Find Services
  {
    entity: {
      id: pid(8),
      entity_type: "service",
      entity_subtype: "coach",
      title: "CoreForm Studio",
      short_description: "Strength coaching, fitness systems, and body performance guidance.",
      primary_category: "fitness",
      tags: ["fitness", "coaching", "strength", "gym"],
      visibility_tier: "free",
      is_verified: false,
      domain_host: null,
      slug: "coreform-studio",
      industry: "Health & Fitness",
      surface_type: "quick_site",
      cover_image_url: coreformStudio,
      published_at: "2025-09-25T00:00:00Z",
      relevance_score: 74,
      trust_score: 48,
    },
    identity: "person",
    preferredSection: "services",
  },
  // 9. CrunchHouse Kitchen — Buy From
  {
    entity: {
      id: pid(9),
      entity_type: "business",
      entity_subtype: "general",
      title: "CrunchHouse Kitchen",
      short_description: "Fast flavor culture, premium meals, and modern food campaigns.",
      primary_category: "shop",
      tags: ["food", "restaurant", "fast-food", "kitchen"],
      visibility_tier: "free",
      is_verified: false,
      domain_host: null,
      slug: "crunchhouse-kitchen",
      industry: "Food & Dining",
      surface_type: "emenu",
      cover_image_url: crunchhouseKitchen,
      published_at: "2025-10-15T00:00:00Z",
      relevance_score: 71,
      trust_score: 44,
    },
    identity: "mixed",
    preferredSection: "popular",
  },
  // 10. CivicLaw Advisory — Trusted Businesses
  {
    entity: {
      id: pid(10),
      entity_type: "business",
      entity_subtype: "consultant",
      title: "CivicLaw Advisory",
      short_description: "Legal clarity, regulatory intelligence, and trusted advisory insight.",
      primary_category: "professional-services",
      tags: ["legal", "advisory", "law", "compliance"],
      visibility_tier: "verified",
      is_verified: true,
      domain_host: null,
      slug: "civiclaw-advisory",
      industry: "Legal Services",
      surface_type: "quick_site",
      cover_image_url: civiclawAdvisory,
      published_at: "2025-07-01T00:00:00Z",
      relevance_score: 78,
      trust_score: 72,
    },
    identity: "brand",
    preferredSection: "verified",
  },
  // 11. Kaya Properties — Trusted Businesses
  {
    entity: {
      id: pid(11),
      entity_type: "business",
      entity_subtype: "general",
      title: "Kaya Properties",
      short_description: "Premium real estate listings, property management, and trusted home sourcing.",
      primary_category: "real-estate",
      tags: ["real-estate", "property", "homes", "listings"],
      visibility_tier: "verified",
      is_verified: true,
      domain_host: null,
      slug: "kaya-properties",
      industry: "Real Estate",
      surface_type: "quick_site",
      cover_image_url: kayaProperties,
      published_at: "2025-08-15T00:00:00Z",
      relevance_score: 79,
      trust_score: 66,
    },
    identity: "brand",
    preferredSection: "verified",
  },
  // 12. FreshCutz Barbers — Find Services
  {
    entity: {
      id: pid(12),
      entity_type: "service",
      entity_subtype: "freelancer",
      title: "FreshCutz Barbers",
      short_description: "Premium grooming, precision cuts, and modern barbershop culture.",
      primary_category: "grooming",
      tags: ["barber", "grooming", "haircuts", "salon"],
      visibility_tier: "free",
      is_verified: false,
      domain_host: null,
      slug: "freshcutz-barbers",
      industry: "Beauty & Grooming",
      surface_type: "quick_site",
      cover_image_url: freshcutzBarbers,
      published_at: "2025-09-01T00:00:00Z",
      relevance_score: 67,
      trust_score: 38,
    },
    identity: "person",
    preferredSection: "services",
  },
  // 13. SoleVault Sneakers — Buy From
  {
    entity: {
      id: pid(13),
      entity_type: "business",
      entity_subtype: "general",
      title: "SoleVault Sneakers",
      short_description: "Authentic sneaker drops, streetwear culture, and premium footwear.",
      primary_category: "shop",
      tags: ["sneakers", "shoes", "streetwear", "footwear"],
      visibility_tier: "free",
      is_verified: false,
      domain_host: null,
      slug: "solevault-sneakers",
      industry: "Footwear & Fashion",
      surface_type: "eshop",
      cover_image_url: solevaultSneakers,
      published_at: "2025-10-10T00:00:00Z",
      relevance_score: 69,
      trust_score: 41,
    },
    identity: "brand",
    preferredSection: "popular",
  },
  // 14. GlowLab Beauty — Buy From
  {
    entity: {
      id: pid(14),
      entity_type: "business",
      entity_subtype: "general",
      title: "GlowLab Beauty",
      short_description: "Natural skincare, beauty routines, and glow-up essentials.",
      primary_category: "shop",
      tags: ["skincare", "beauty", "cosmetics", "wellness"],
      visibility_tier: "free",
      is_verified: false,
      domain_host: null,
      slug: "glowlab-beauty",
      industry: "Beauty & Skincare",
      surface_type: "eshop",
      cover_image_url: glowlabBeauty,
      published_at: "2025-11-05T00:00:00Z",
      relevance_score: 73,
      trust_score: 46,
    },
    identity: "mixed",
    preferredSection: "popular",
  },
  // 15. NovaLimit Software — Trusted Businesses
  {
    entity: {
      id: pid(15),
      entity_type: "business",
      entity_subtype: "general",
      title: "NovaLimit Software",
      short_description: "Powerful trading tools, real-time analytics, and secure digital platforms.",
      primary_category: "software",
      tags: ["software", "analytics", "trading", "fintech"],
      visibility_tier: "verified",
      is_verified: true,
      domain_host: null,
      slug: "novalimit-software",
      industry: "Software & Technology",
      surface_type: "quick_site",
      cover_image_url: novalimitSoftware,
      published_at: "2025-08-01T00:00:00Z",
      relevance_score: 81,
      trust_score: 69,
    },
    identity: "brand",
    preferredSection: "verified",
  },
  // 16. SkyBound Travels — Find Services
  {
    entity: {
      id: pid(16),
      entity_type: "service",
      entity_subtype: "general",
      title: "SkyBound Travels",
      short_description: "Global travel experiences, flight deals, and curated destination adventures.",
      primary_category: "travel",
      tags: ["travel", "flights", "tourism", "adventures"],
      visibility_tier: "free",
      is_verified: false,
      domain_host: null,
      slug: "skybound-travels",
      industry: "Travel & Tourism",
      surface_type: "quick_site",
      cover_image_url: skyboundTravels,
      published_at: "2025-09-20T00:00:00Z",
      relevance_score: 70,
      trust_score: 43,
    },
    identity: "brand",
    preferredSection: "services",
  },
];

// ── Section-filtered getters ──

/** Get placeholder entities for a specific Explore section */
export function getPlaceholdersForSection(
  section: PlaceholderSurface["preferredSection"],
): SearchEntityResult[] {
  return ALL_PLACEHOLDERS
    .filter((p) => p.preferredSection === section)
    .map((p) => p.entity);
}

/** Get all 16 placeholder entities (for popular grid fallback) */
export function getAllPlaceholderEntities(): SearchEntityResult[] {
  return ALL_PLACEHOLDERS.map((p) => p.entity);
}

/**
 * Merge live entities with placeholder backfill.
 * Live entities always take priority; placeholders fill remaining slots.
 * Prevents duplicates by checking IDs.
 */
export function backfillWithPlaceholders(
  liveEntities: SearchEntityResult[],
  section: PlaceholderSurface["preferredSection"],
  slotCount: number,
): SearchEntityResult[] {
  if (liveEntities.length >= slotCount) return liveEntities.slice(0, slotCount);

  const liveIds = new Set(liveEntities.map((e) => e.id));
  const placeholders = getPlaceholdersForSection(section)
    .filter((p) => !liveIds.has(p.id));

  // If section-specific placeholders aren't enough, pull from all
  const remaining = slotCount - liveEntities.length;
  let backfill = placeholders.slice(0, remaining);

  if (backfill.length < remaining) {
    const usedIds = new Set([...liveIds, ...backfill.map((b) => b.id)]);
    const extras = getAllPlaceholderEntities()
      .filter((p) => !usedIds.has(p.id))
      .slice(0, remaining - backfill.length);
    backfill = [...backfill, ...extras];
  }

  return [...liveEntities, ...backfill];
}
