import {
  LayoutDashboard,
  Users,
  BarChart3,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  HeadphonesIcon,
  UserPlus,
  CalendarDays,
  Settings,
  Wallet,
  BookOpen,
  FolderOpen,
  Calendar,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import type { AgencyRole } from "@/hooks/useRoles";

export interface AgencyNavItem {
  title: string;
  slug: string;
  icon: LucideIcon;
  end?: boolean;
  allowedRoles: AgencyRole[];
}

export interface AgencyNavGroup {
  label: string;
  items: AgencyNavItem[];
}

/** All 6 agency roles for convenience */
const ALL_ROLES: AgencyRole[] = ["agency_admin", "agency_manager", "foot_soldier", "finance_officer", "creator", "influencer"];
const LEADERS: AgencyRole[] = ["agency_admin", "agency_manager"];

export const agencyNavGroups: AgencyNavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", slug: "", icon: LayoutDashboard, end: true, allowedRoles: ALL_ROLES },
      { title: "Analytics", slug: "analytics", icon: BarChart3, allowedRoles: [...LEADERS, "finance_officer"] },
      { title: "Performance", slug: "performance", icon: TrendingUp, allowedRoles: [...LEADERS, "foot_soldier", "influencer"] },
    ],
  },
  {
    label: "Team",
    items: [
      { title: "Foot Soldiers", slug: "members", icon: Users, allowedRoles: LEADERS },
      { title: "Onboarding", slug: "onboarding", icon: UserPlus, allowedRoles: [...LEADERS, "foot_soldier"] },
      { title: "KYC Status", slug: "kyc", icon: ShieldCheck, allowedRoles: ["agency_admin"] },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Commissions", slug: "commissions", icon: DollarSign, allowedRoles: [...LEADERS, "foot_soldier", "finance_officer", "influencer"] },
      { title: "Payouts", slug: "payouts", icon: Wallet, allowedRoles: [...LEADERS, "foot_soldier", "finance_officer", "influencer"] },
    ],
  },
  {
    label: "Marketing",
    items: [
      { title: "Asset Library", slug: "assets", icon: FolderOpen, allowedRoles: ALL_ROLES },
      { title: "Content Calendar", slug: "content-calendar", icon: Calendar, allowedRoles: ["agency_admin", "creator"] },
    ],
  },
  {
    label: "Planning",
    items: [
      { title: "Vision Board", slug: "vision-board", icon: Lightbulb, allowedRoles: ALL_ROLES },
    ],
  },
  {
    label: "Resources",
    items: [
      { title: "Quick Start", slug: "learning", icon: BookOpen, allowedRoles: ALL_ROLES },
      { title: "Hub Booking", slug: "hub", icon: CalendarDays, allowedRoles: ALL_ROLES },
    ],
  },
  {
    label: "Admin",
    items: [
      { title: "Support", slug: "support", icon: HeadphonesIcon, allowedRoles: LEADERS },
      { title: "Settings", slug: "settings", icon: Settings, allowedRoles: ["agency_admin"] },
    ],
  },
];

/** Flat section labels for breadcrumbs */
export const agencySectionLabels: Record<string, string> = {};
for (const group of agencyNavGroups) {
  for (const item of group.items) {
    if (item.slug) agencySectionLabels[item.slug] = item.title;
  }
}
agencySectionLabels[""] = "Dashboard";
