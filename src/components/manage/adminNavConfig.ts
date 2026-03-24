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
  Headset,
  Shield,
  Image,
  AlertTriangle,
  Radio,
  Eye,
  Mail,
  Zap,
  Search,
  Building2,
  Bell,
  Database,
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
      { title: "Command Center", slug: "command-center", icon: Radio, allowedRoles: ["admin"] },
      { title: "Dashboard", slug: "", icon: LayoutDashboard, end: true, allowedRoles: ["admin"] },
      { title: "Explore Dashboard", slug: "explore-dashboard", icon: Layers, allowedRoles: ["admin"] },
      { title: "Analytics", slug: "analytics", icon: BarChart3, allowedRoles: ["admin", "analyst"] },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "Users", slug: "users", icon: Users, allowedRoles: ["admin"] },
      { title: "KYC Control", slug: "kyc", icon: Shield, allowedRoles: ["admin"] },
      { title: "Payments", slug: "payments", icon: CreditCard, allowedRoles: ["admin"] },
      { title: "AI Usage", slug: "ai-usage", icon: Image, allowedRoles: ["admin"] },
      { title: "Surface Moderation", slug: "surface-moderation", icon: Eye, allowedRoles: ["admin"] },
      { title: "Incidents", slug: "incidents", icon: AlertTriangle, allowedRoles: ["admin"] },
      { title: "Media Control", slug: "media", icon: Image, allowedRoles: ["admin"] },
      { title: "Notifications", slug: "notifications", icon: Mail, allowedRoles: ["admin"] },
      { title: "Team & Invites", slug: "team", icon: UserPlus, allowedRoles: ["admin", "owner"] },
      { title: "Pricing & Subscriptions", slug: "pricing", icon: CreditCard, allowedRoles: ["admin"] },
      { title: "Promos & Rewards", slug: "promos", icon: Megaphone, allowedRoles: ["admin"] },
      { title: "Navigation", slug: "navigation", icon: Layers, allowedRoles: ["admin"] },
      { title: "Community", slug: "community", icon: Megaphone, allowedRoles: ["admin", "moderator"] },
      { title: "Messages", slug: "messages", icon: MessageSquare, allowedRoles: ["admin", "content_editor"] },
      { title: "Support Queue", slug: "support", icon: Headset, allowedRoles: ["admin"] },
      { title: "Surfaces", slug: "surfaces", icon: Layers, allowedRoles: ["admin"] },
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
      { title: "Automation", slug: "automation", icon: Zap, allowedRoles: ["admin"] },
      { title: "Smart Alerts", slug: "smart-alerts", icon: Bell, allowedRoles: ["admin"] },
      { title: "Global Search", slug: "search", icon: Search, allowedRoles: ["admin", "moderator"] },
      { title: "Integrations", slug: "integrations", icon: Puzzle, allowedRoles: ["admin"] },
      { title: "Research & Testing", slug: "research-testing", icon: FlaskConical, allowedRoles: ["admin", "analyst"] },
      { title: "Alerts & Security", slug: "alerts-security", icon: ShieldAlert, allowedRoles: ["admin"] },
      { title: "Data Integrity", slug: "data-integrity", icon: Database, allowedRoles: ["admin"] },
    ],
  },
  {
    label: "Agency",
    items: [
      { title: "Agency Overview", slug: "agencies", icon: Building2, allowedRoles: ["admin"] },
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
sectionLabels["support"] = "Support Queue";
sectionLabels["content"] = "Content Engine";
sectionLabels["explore-dashboard"] = "Explore Dashboard";
sectionLabels["navigation"] = "Navigation Manager";
sectionLabels["command-center"] = "Command Center";
sectionLabels["kyc"] = "KYC Control";
sectionLabels["payments"] = "Payments Control";
sectionLabels["ai-usage"] = "AI Usage Control";
sectionLabels["incidents"] = "Incidents";
sectionLabels["surface-moderation"] = "Surface Moderation";
sectionLabels["media"] = "Media Control";
sectionLabels["notifications"] = "Notification Control";
