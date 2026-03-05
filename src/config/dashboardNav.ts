/**
 * Centralized Dashboard Navigation Config
 * Single source of truth for sidebar items + role gating.
 */

import {
  Compass, Tag, MessageCircle, ShoppingBag, Sparkles, Palette,
  LayoutDashboard, BookOpen, Package, Users, Store, Globe, Link,
  UtensilsCrossed, Home, Lightbulb, Bookmark, TrendingUp,
  Layers, Image, FileText, Settings, Zap, Sparkle, Grid3X3,
  Building2, CreditCard, FileBarChart, BarChart3, UserCircle,
  ShieldCheck, Briefcase, GraduationCap,
} from "lucide-react";

// ── Account type model ───────────────────────────────────────
export type AccountType = "user" | "agency" | "admin";

/** @deprecated Use AccountType instead */
export type UserType = AccountType;

/**
 * Resolve account type from auth/profile data.
 * Priority: admin > agency > user.
 */
export function resolveAccountType(opts: {
  isAdmin: boolean;
  creatorType: string | null | undefined;
}): AccountType {
  if (opts.isAdmin) return "admin";
  if (opts.creatorType === "organization") return "agency";
  return "user";
}

/** @deprecated Use resolveAccountType instead */
export const resolveUserType = resolveAccountType;

// ── Nav item types ───────────────────────────────────────────
export interface NavItem {
  icon: any;
  label: string;
  chevron: boolean;
  badge?: string;
  dot?: boolean;
  customIcon?: string;
  to?: string;
  subItems?: NavSubItem[];
  /** Account types allowed to see this item. If omitted → all types. */
  rolesAllowed?: AccountType[];
}

export interface NavSubItem {
  icon: any;
  label: string;
  to?: string;
  badge?: string;
  /** Account types allowed to see this sub-item. If omitted → all types. */
  rolesAllowed?: AccountType[];
  /** If true, only org owners see this item (requires isOrgOwner context). */
  ownerOnly?: boolean;
}

export interface NavSection {
  title: string;
  items: NavSubItem[];
}

// ── Primary sidebar items ────────────────────────────────────
export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { icon: Compass, label: "Explore", chevron: true, to: "/dashboard/explore" },
  { icon: Tag, label: "Offers", chevron: false, badge: "+120%", dot: true, to: "/dashboard/offers" },
  { icon: MessageCircle, label: "Messages", chevron: false, to: "/dashboard/messages" },
  { icon: LayoutDashboard, label: "Dashboard", chevron: true, to: "/dashboard/dashboard" },
  { icon: null, label: "Ada AI", chevron: true, customIcon: "ada", to: "/dashboard/ada" },
  {
    icon: ShoppingBag,
    label: "Seller",
    chevron: true,
    subItems: [
      { icon: ShoppingBag, label: "Eshop", to: "/dashboard/seller/eshop" },
      { icon: Store, label: "Estore", to: "/dashboard/seller/estore" },
      { icon: UtensilsCrossed, label: "Emenu", to: "/dashboard/seller/emenu" },
      { icon: Globe, label: "Esite", to: "/dashboard/seller/esite" },
      { icon: Link, label: "Eshop Connect", to: "/dashboard/seller/eshop-connect" },
    ],
  },
  { icon: Sparkles, label: "Influencer", chevron: true, to: "/dashboard/influencer" },
  { icon: Palette, label: "Yangu Studio", chevron: true, to: "/dashboard/studio" },
  { icon: BookOpen, label: "Visionaire", chevron: true, to: "/dashboard/visionaire" },
  { icon: Package, label: "App Store", chevron: false, badge: "+120%", to: "/dashboard/app-store" },
  { icon: Users, label: "Community", chevron: false, to: "/dashboard/community" },
];

// ── Extended sidebar panels ──────────────────────────────────
export const EXTENDED_SIDEBAR_ITEMS = ["Visionaire", "Dashboard"];

export const VISIONAIRE_SECTIONS: NavSection[] = [
  {
    title: "MASTER LIBRARY",
    items: [
      { icon: Home, label: "Home", to: "/dashboard/visionaire" },
      { icon: Lightbulb, label: "Product Requests", to: "/dashboard/visionaire/requests" },
      { icon: Bookmark, label: "Saved", to: "/dashboard/visionaire/saved" },
    ],
  },
  {
    title: "RESOURCES",
    items: [
      { icon: GraduationCap, label: "Digital Product University", to: "/dashboard/visionaire/university" },
      { icon: TrendingUp, label: "Evergreen Problems", badge: "NEW", to: "/dashboard/visionaire/evergreen" },
      { icon: Layers, label: "Product Mockups", to: "/dashboard/visionaire/mockups" },
      { icon: Image, label: "Book Covers", to: "/dashboard/visionaire/book-covers" },
      { icon: Tag, label: "Special Deals", to: "/dashboard/visionaire/deals" },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { icon: FileText, label: "PDF Rebrander", to: "/dashboard/visionaire/tools/pdf-rebrander" },
      { icon: Settings, label: "Product Descriptions", to: "/dashboard/visionaire/tools/product-descriptions" },
      { icon: Zap, label: "Product Ideas", to: "/dashboard/visionaire/tools/product-ideas" },
      { icon: Sparkle, label: "Book Title Generator", to: "/dashboard/visionaire/tools/book-title-generator" },
    ],
  },
];

export const DASHBOARD_SECTIONS: NavSection[] = [
  {
    title: "GENERAL",
    items: [
      { icon: Home, label: "Dashboard", to: "/dashboard/home" },
      { icon: Grid3X3, label: "My Apps", to: "/dashboard/my-apps" },
      { icon: Building2, label: "My Business", to: "/dashboard/my-business" },
    ],
  },
  {
    title: "USER MANAGEMENT",
    items: [
      { icon: CreditCard, label: "Payment settings", to: "/dashboard/payment-settings" },
      { icon: FileBarChart, label: "Invoices", to: "/dashboard/invoices" },
    ],
  },
  {
    title: "MARKETING",
    items: [
      { icon: BarChart3, label: "Ads", to: "/dashboard/ads" },
      { icon: Tag, label: "Promo Codes", to: "/dashboard/promo-codes" },
      { icon: Users, label: "Affiliates", to: "/dashboard/affiliates" },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { icon: UserCircle, label: "Profile", to: "/dashboard/profile" },
      { icon: ShieldCheck, label: "Admin", to: "/manage", rolesAllowed: ["admin"] },
      { icon: Briefcase, label: "My Agency", to: "/dashboard/agency", rolesAllowed: ["agency"], ownerOnly: true },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────
/** Filter a nav item by accountType and optional owner flag. */
export function isNavItemVisible(
  item: { rolesAllowed?: AccountType[]; ownerOnly?: boolean },
  accountType: AccountType,
  isOrgOwner?: boolean,
): boolean {
  if (item.rolesAllowed && !item.rolesAllowed.includes(accountType)) return false;
  if (item.ownerOnly && !isOrgOwner) return false;
  return true;
}
