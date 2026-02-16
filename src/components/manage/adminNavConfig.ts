import {
  MessageSquare,
  LayoutDashboard,
  Users,
  Layers,
  Megaphone,
  Bot,
  Globe,
  Settings,
  ScrollText,
  BarChart3,
  FileText,
  Newspaper,
  Calendar,
  Palette,
  Puzzle,
  FlaskConical,
  FileStack,
  ShieldAlert,
  CreditCard,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { ManageRole } from "@/hooks/useRoles";

export interface AdminNavItem {
  title: string;
  to: string;
  icon: LucideIcon;
  /** If true, NavLink uses `end` matching */
  end?: boolean;
  /** Roles that can see this item. Admin always sees everything. */
  allowedRoles: ManageRole[];
  /** Nested children rendered as sub-items */
  children?: AdminNavItem[];
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "AI",
    items: [
      { title: "ADA AI", to: "/manage/ada", icon: Bot, allowedRoles: ["admin"] },
    ],
  },
  {
    label: "Overview",
    items: [
      { title: "Dashboard", to: "/manage", icon: LayoutDashboard, end: true, allowedRoles: ["admin"] },
      { title: "Analytics", to: "/manage/analytics", icon: BarChart3, allowedRoles: ["admin", "analyst"] },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "Users", to: "/manage/users", icon: Users, allowedRoles: ["admin"] },
      { title: "Team & Invites", to: "/manage/team", icon: UserPlus, allowedRoles: ["admin", "owner"] },
      { title: "Pricing & Subscriptions", to: "/manage/pricing", icon: CreditCard, allowedRoles: ["admin"] },
      { title: "Promos & Rewards", to: "/manage/promos", icon: Megaphone, allowedRoles: ["admin"] },
      { title: "Navigation", to: "/manage/navigation", icon: Layers, allowedRoles: ["admin"] },
      { title: "Community", to: "/manage/community", icon: Megaphone, allowedRoles: ["admin", "moderator"] },
      { title: "Messages", to: "/manage/messages", icon: MessageSquare, allowedRoles: ["admin", "content_editor"] },
      { title: "Agents", to: "/manage/agents", icon: Bot, allowedRoles: ["admin"] },
      { title: "Domains", to: "/manage/domains", icon: Globe, allowedRoles: ["admin"] },
    ],
  },
  {
    label: "Content Engine",
    items: [
      { title: "Blog (Layout & Engine)", to: "/manage/content/blog", icon: FileText, allowedRoles: ["admin", "writer", "content_editor"] },
      { title: "Articles / News", to: "/manage/content/news", icon: Newspaper, allowedRoles: ["admin", "writer", "content_editor"] },
      { title: "Events (Registration)", to: "/manage/content/events", icon: Calendar, allowedRoles: ["admin", "writer", "content_editor"] },
    ],
  },
  {
    label: "Design & Pages",
    items: [
      { title: "Branding", to: "/manage/branding", icon: Palette, allowedRoles: ["admin", "designer"] },
      { title: "Pages", to: "/manage/pages", icon: FileStack, allowedRoles: ["admin", "designer"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Integrations", to: "/manage/integrations", icon: Puzzle, allowedRoles: ["admin"] },
      { title: "Research & Testing", to: "/manage/research-testing", icon: FlaskConical, allowedRoles: ["admin", "analyst"] },
      { title: "Alerts & Security", to: "/manage/alerts-security", icon: ShieldAlert, allowedRoles: ["admin"] },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", to: "/manage/settings", icon: Settings, allowedRoles: ["admin", "content_editor"] },
      { title: "Audit Logs", to: "/manage/audit-logs", icon: ScrollText, allowedRoles: ["admin", "moderator"] },
    ],
  },
];

/** Flat list of all section labels keyed by slug for breadcrumbs */
export const sectionLabels: Record<string, string> = {};
for (const group of adminNavGroups) {
  for (const item of group.items) {
    const slug = item.to.replace("/manage/", "").replace("/manage", "");
    if (slug) sectionLabels[slug] = item.title;
    if (item.children) {
      for (const child of item.children) {
        const childSlug = child.to.replace("/manage/", "");
        sectionLabels[childSlug] = child.title;
      }
    }
  }
}
// Manual overrides for grouped labels
sectionLabels["community"] = "Community (Promotions)";
sectionLabels["pricing"] = "Pricing & Subscriptions";
sectionLabels["research-testing"] = "Research & Testing";
sectionLabels["alerts-security"] = "Alerts & Security";
sectionLabels["content/blog"] = "Blog (Layout & Engine)";
sectionLabels["content/news"] = "Articles / News";
sectionLabels["content/events"] = "Events (Registration)";
sectionLabels["ada"] = "ADA AI";
sectionLabels["messages"] = "Messages & Support";
sectionLabels["content"] = "Content Engine";
sectionLabels["navigation"] = "Navigation Manager";
