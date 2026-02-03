// Domain-specific route configuration
// Defines which routes are accessible per domain type

import type { Database } from "@/integrations/supabase/types";

type DomainType = Database["public"]["Enums"]["surface_type"] | "io";

export interface DomainRouteConfig {
  /** Routes accessible on this domain */
  allowedRoutes: string[];
  /** Default landing page after auth */
  defaultRoute: string;
  /** Primary CTA text */
  primaryCta: string;
  /** Secondary CTA text */
  secondaryCta?: string;
  /** Navigation items to show */
  navItems: NavItem[];
  /** Display label for this domain */
  label: string;
  /** Icon name from lucide-react */
  icon: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon?: string;
}

// Route patterns that are always allowed (auth, common pages)
export const UNIVERSAL_ROUTES = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/verify-email",
  "/auth/reset-password",
  "/auth/update-password",
  "/auth/callback",
  "/onboarding",
  "/dashboard",
  "/kyc",
  "/billing",
  "/settings",
  "/profile",
] as const;

// Domain-specific route configurations
export const DOMAIN_ROUTE_CONFIG: Record<DomainType, DomainRouteConfig> = {
  // Identity Hub - yangu.io
  io: {
    allowedRoutes: [
      ...UNIVERSAL_ROUTES,
      "/surfaces/:id/edit",
      "/s/:id/preview",
      "/s/:domain/:slug",
    ],
    defaultRoute: "/dashboard",
    primaryCta: "Claim Your Space",
    secondaryCta: "Explore Creators",
    navItems: [
      { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
      { label: "Profile", path: "/profile", icon: "User" },
      { label: "Settings", path: "/settings", icon: "Settings" },
    ],
    label: "YANGU",
    icon: "Home",
  },

  // Shop - yangu.shop
  shop: {
    allowedRoutes: [
      ...UNIVERSAL_ROUTES,
      "/products",
      "/products/:id",
      "/products/new",
      "/orders",
      "/orders/:id",
      "/storefront",
      "/storefront/settings",
    ],
    defaultRoute: "/storefront",
    primaryCta: "Open Your Shop",
    secondaryCta: "Browse Products",
    navItems: [
      { label: "Storefront", path: "/storefront", icon: "Store" },
      { label: "Products", path: "/products", icon: "Package" },
      { label: "Orders", path: "/orders", icon: "ShoppingCart" },
    ],
    label: "Shop",
    icon: "Store",
  },

  // Store - yangu.store (digital products / trading)
  store: {
    allowedRoutes: [
      ...UNIVERSAL_ROUTES,
      "/inventory",
      "/inventory/:id",
      "/listings",
      "/listings/new",
      "/transactions",
    ],
    defaultRoute: "/inventory",
    primaryCta: "List Your Items",
    secondaryCta: "Browse Store",
    navItems: [
      { label: "Inventory", path: "/inventory", icon: "Package" },
      { label: "Listings", path: "/listings", icon: "Tag" },
      { label: "Transactions", path: "/transactions", icon: "ArrowLeftRight" },
    ],
    label: "Store",
    icon: "Package",
  },

  // Site - yangu.site (personal websites)
  site: {
    allowedRoutes: [
      ...UNIVERSAL_ROUTES,
      "/pages",
      "/pages/:id",
      "/pages/new",
      "/media",
      "/site/settings",
    ],
    defaultRoute: "/pages",
    primaryCta: "Build Your Site",
    secondaryCta: "View Templates",
    navItems: [
      { label: "Pages", path: "/pages", icon: "FileText" },
      { label: "Media", path: "/media", icon: "Image" },
      { label: "Settings", path: "/site/settings", icon: "Settings" },
    ],
    label: "Site",
    icon: "Globe",
  },

  // Studio - yangu.studio (services / portfolio)
  studio: {
    allowedRoutes: [
      ...UNIVERSAL_ROUTES,
      "/portfolio",
      "/portfolio/:id",
      "/services",
      "/services/:id",
      "/services/new",
      "/bookings",
      "/bookings/:id",
    ],
    defaultRoute: "/portfolio",
    primaryCta: "Showcase Your Work",
    secondaryCta: "Find Services",
    navItems: [
      { label: "Portfolio", path: "/portfolio", icon: "Palette" },
      { label: "Services", path: "/services", icon: "Briefcase" },
      { label: "Bookings", path: "/bookings", icon: "Calendar" },
    ],
    label: "Studio",
    icon: "Palette",
  },

  // Live - yangu.live (streaming / sessions)
  live: {
    allowedRoutes: [
      ...UNIVERSAL_ROUTES,
      "/sessions",
      "/sessions/:id",
      "/sessions/new",
      "/schedule",
      "/go-live",
    ],
    defaultRoute: "/sessions",
    primaryCta: "Go Live",
    secondaryCta: "Watch Now",
    navItems: [
      { label: "Sessions", path: "/sessions", icon: "Video" },
      { label: "Schedule", path: "/schedule", icon: "Calendar" },
      { label: "Go Live", path: "/go-live", icon: "Radio" },
    ],
    label: "Live",
    icon: "Radio",
  },

  // Community - yangu.community (groups / feeds)
  community: {
    allowedRoutes: [
      ...UNIVERSAL_ROUTES,
      "/groups",
      "/groups/:id",
      "/groups/new",
      "/feed",
      "/members",
      "/events",
      "/events/:id",
    ],
    defaultRoute: "/feed",
    primaryCta: "Start Your Community",
    secondaryCta: "Join Communities",
    navItems: [
      { label: "Feed", path: "/feed", icon: "Rss" },
      { label: "Groups", path: "/groups", icon: "Users" },
      { label: "Events", path: "/events", icon: "Calendar" },
    ],
    label: "Community",
    icon: "Users",
  },
};

// Default fallback domain type
export const DEFAULT_DOMAIN_TYPE: DomainType = "io";

// Get route config for a domain type
export function getDomainRouteConfig(domainType: DomainType | null): DomainRouteConfig {
  return DOMAIN_ROUTE_CONFIG[domainType ?? DEFAULT_DOMAIN_TYPE];
}

// Check if a route is allowed for a domain type
export function isRouteAllowedForDomain(
  route: string,
  domainType: DomainType | null
): boolean {
  const config = getDomainRouteConfig(domainType);
  
  // Check exact match first
  if (config.allowedRoutes.includes(route)) {
    return true;
  }
  
  // Check pattern matches (e.g., /products/:id)
  return config.allowedRoutes.some((allowedRoute) => {
    const pattern = allowedRoute
      .replace(/:[^/]+/g, "[^/]+")
      .replace(/\//g, "\\/");
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(route);
  });
}
