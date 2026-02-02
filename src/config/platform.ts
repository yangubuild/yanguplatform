// YANGU Platform Configuration
// This file defines all platform-wide settings, subdomains, and feature flags

export const PLATFORM_NAME = "YANGU" as const;

export const SUBDOMAINS = {
  shop: {
    id: "shop",
    domain: "yangu.shop",
    label: "Shop",
    description: "Create your own online store",
    icon: "Store",
    color: "emerald",
  },
  store: {
    id: "store",
    domain: "yangu.store",
    label: "Store",
    description: "Sell digital products and downloads",
    icon: "Package",
    color: "blue",
  },
  site: {
    id: "site",
    domain: "yangu.site",
    label: "Site",
    description: "Build your personal website",
    icon: "Globe",
    color: "violet",
  },
  studio: {
    id: "studio",
    domain: "yangu.studio",
    label: "Studio",
    description: "Showcase your creative portfolio",
    icon: "Palette",
    color: "amber",
  },
  live: {
    id: "live",
    domain: "yangu.live",
    label: "Live",
    description: "Stream and connect in real-time",
    icon: "Radio",
    color: "rose",
  },
  community: {
    id: "community",
    domain: "yangu.community",
    label: "Community",
    description: "Build and grow your community",
    icon: "Users",
    color: "cyan",
  },
} as const;

export type SubdomainKey = keyof typeof SUBDOMAINS;
export type Subdomain = (typeof SUBDOMAINS)[SubdomainKey];

export const FEATURES = {
  discovery: {
    enabled: true,
    isPaid: true,
    description: "Get discovered on the YANGU platform",
  },
  customDomain: {
    enabled: true,
    isPaid: true,
    description: "Connect your own domain",
  },
  analytics: {
    enabled: true,
    isPaid: false,
    description: "Track your visitors and engagement",
  },
  storage: {
    enabled: true,
    isPaid: false,
    freeLimit: "1GB",
    description: "Store your files and media",
  },
} as const;

export const API_ENDPOINTS = {
  // These will be populated with actual Supabase URLs
  auth: "/auth",
  storage: "/storage",
  functions: "/functions",
} as const;

export const THEME_CONFIG = {
  defaultTheme: "dark" as const,
  storageKey: "yangu-theme",
  themes: ["light", "dark"] as const,
};

export type Theme = (typeof THEME_CONFIG.themes)[number];
