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
  type LucideIcon,
} from "lucide-react";
import type { AgencyRole } from "@/hooks/useRoles";

export interface AgencyNavItem {
  title: string;
  slug: string;
  icon: LucideIcon;
  end?: boolean;
  /** Roles that can see this item. agency_admin always sees everything. */
  allowedRoles: AgencyRole[];
}

export interface AgencyNavGroup {
  label: string;
  items: AgencyNavItem[];
}

export const agencyNavGroups: AgencyNavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", slug: "", icon: LayoutDashboard, end: true, allowedRoles: ["agency_admin", "agency_manager", "foot_soldier"] },
      { title: "Analytics", slug: "analytics", icon: BarChart3, allowedRoles: ["agency_admin", "agency_manager"] },
      { title: "Performance", slug: "performance", icon: TrendingUp, allowedRoles: ["agency_admin", "agency_manager", "foot_soldier"] },
    ],
  },
  {
    label: "Team",
    items: [
      { title: "Foot Soldiers", slug: "members", icon: Users, allowedRoles: ["agency_admin", "agency_manager"] },
      { title: "Onboarding", slug: "onboarding", icon: UserPlus, allowedRoles: ["agency_admin", "agency_manager", "foot_soldier"] },
      { title: "KYC Status", slug: "kyc", icon: ShieldCheck, allowedRoles: ["agency_admin"] },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Commissions", slug: "commissions", icon: DollarSign, allowedRoles: ["agency_admin", "agency_manager", "foot_soldier"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Hub Booking", slug: "hub", icon: CalendarDays, allowedRoles: ["agency_admin", "agency_manager", "foot_soldier"] },
      { title: "Support", slug: "support", icon: HeadphonesIcon, allowedRoles: ["agency_admin", "agency_manager"] },
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
