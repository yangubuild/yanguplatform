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
import { manageLink } from "@/lib/routing/managePathUtils";

export interface AdminNavItem {
  title: string;
  /** Panel-relative slug (e.g. "users", "content/blog"). Resolved at render via manageLink(). */
  slug: string;
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
      { title: "ADA AI", slug: "ada", icon: Bot, allowedRoles: ["admin"] },
    ],
  },
  {
    label: "Overview",
    items: [
      { title: "Dashboard", slug: "", icon: LayoutDashboard, end: true, allowedRoles: ["admin"] },
      { title: "Analytics", slug: "analytics", icon: BarChart3, allowedRoles: ["admin", "analyst"] },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "Users", slug: "users", icon: Users, allowedRoles: ["admin"] },
      { title: "Team & Invites", slug: "team", icon: UserPlus, allowedRoles: ["admin", "owner"] },
      { title: "Pricing & Subscriptions", slug: "pricing", icon: CreditCard, allowedRoles: ["admin"] },
      { title: "Promos & Rewards", slug: "promos", icon: Megaphone, allowedRoles: ["admin"] },
      { title: "Navigation", slug: "navigation", icon: Layers, allowedRoles: ["admin"] },
      { title: "Community", slug: "community", icon: Megaphone, allowedRoles: ["admin", "moderator"] },
      { title: "Messages", slug: "messages", icon: MessageSquare, allowedRoles: ["admin", "content_editor"] },
      { title: "Agents", slug: "agents", icon: Bot, allowedRoles: ["admin"] },
      { title: "Domains", slug: "domains", icon: Globe, allowedRoles: ["admin"] },
    ],
  },
  {
    label: "Content Engine",
    items: [
      { title: "Blog (Layout & Engine)", slug: "content/blog", icon: FileText, allowedRoles: ["admin", "writer", "content_editor"] },
      { title: "Articles / News", slug: "content/news", icon: Newspaper, allowedRoles: ["admin", "writer", "content_editor"] },
      { title: "Events (Registration)", slug: "content/events", icon: Calendar, allowedRoles: ["admin", "writer", "content_editor"] },
    ],
  },
  {
    label: "Design & Pages",
    items: [
      { title: "Branding", slug: "branding", icon: Palette, allowedRoles: ["admin", "designer"] },
      { title: "Pages", slug: "pages", icon: FileStack, allowedRoles: ["admin", "designer"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Integrations", slug: "integrations", icon: Puzzle, allowedRoles: ["admin"] },
      { title: "Research & Testing", slug: "research-testing", icon: FlaskConical, allowedRoles: ["admin", "analyst"] },
      { title: "Alerts & Security", slug: "alerts-security", icon: ShieldAlert, allowedRoles: ["admin"] },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", slug: "settings", icon: Settings, allowedRoles: ["admin", "content_editor"] },
      { title: "Audit Logs", slug: "audit-logs", icon: ScrollText, allowedRoles: ["admin", "moderator"] },
    ],
  },
];

/** Flat list of all section labels keyed by slug for breadcrumbs */
export const sectionLabels: Record<string, string> = {};
for (const group of adminNavGroups) {
  for (const item of group.items) {
    if (item.slug) sectionLabels[item.slug] = item.title;
    if (item.children) {
      for (const child of item.children) {
        sectionLabels[child.slug] = child.title;
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
