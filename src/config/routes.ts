// YANGU Route Configuration
// Centralized routing definitions

export const ROUTES = {
  // Public routes
  home: "/",
  login: "/login",
  signup: "/signup",
  resetPassword: "/reset-password",
  support: "/support",
  
  // User routes
  dashboard: "/dashboard",
  settings: "/dashboard/settings",
  profile: "/profile",
  kyc: "/kyc",
  billing: "/billing",
  subscriptions: "/subscriptions",
  
  // Surface owner preview (internal, before real domain)
  surfacePreview: (id: string) => `/s/${id}/preview`,
  
  // Public surface routes (domain-scoped)
  publicSurface: "/surface",
  publicProfile: (username: string) => `/@${username}`,
  publicStore: "/store",
  publicStorefront: "/storefront",
  publicServices: "/services",
  publicPortfolio: "/portfolio",
  publicLive: "/live",
  publicFeed: "/feed",
  publicGroups: "/groups",
  
  // Surface editor
  surfaceEditor: (id: string) => `/surfaces/${id}/edit`,
  
  // Surface routes (user's public pages - future real domains)
  surface: (username: string) => `/@${username}`,
  surfaceShop: (username: string) => `/@${username}/shop`,
  surfaceSite: (username: string) => `/@${username}/site`,
  surfaceStudio: (username: string) => `/@${username}/studio`,
  surfaceCommunity: (username: string) => `/@${username}/community`,
  
  // Admin routes
  admin: "/admin",
  adminUsers: "/admin/users",
  adminAnalytics: "/admin/analytics",
} as const;

export type RouteKey = keyof typeof ROUTES;
