// YANGU Route Configuration
// Centralized routing definitions

export const ROUTES = {
  // Public routes
  home: "/",
  login: "/login",
  signup: "/signup",
  resetPassword: "/reset-password",
  
  // User routes
  dashboard: "/dashboard",
  settings: "/settings",
  profile: "/profile",
  
  // Surface preview (internal, before real domain)
  surfacePreview: (id: string) => `/s/${id}`,
  
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
