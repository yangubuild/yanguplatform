// YANGU Platform Types
// Core type definitions for the platform

import type { SubdomainKey } from "@/config/platform";

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Surface {
  id: string;
  userId: string;
  type: SubdomainKey;
  slug: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  customDomain: string | null;
  theme: SurfaceTheme;
  createdAt: string;
  updatedAt: string;
}

export interface SurfaceTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontFamily: string;
  borderRadius: "none" | "sm" | "md" | "lg" | "full";
}

export interface DiscoveryListing {
  id: string;
  surfaceId: string;
  category: string;
  tags: string[];
  isPaid: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}
