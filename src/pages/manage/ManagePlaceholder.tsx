import { useLocation } from "react-router-dom";
import {
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
  Construction,
} from "lucide-react";

const sections: Record<string, { label: string; icon: React.ElementType }> = {
  users: { label: "Users", icon: Users },
  surfaces: { label: "Surfaces", icon: Layers },
  community: { label: "Community (Promotions)", icon: Megaphone },
  agents: { label: "Agents", icon: Bot },
  domains: { label: "Domains", icon: Globe },
  settings: { label: "Settings", icon: Settings },
  "audit-logs": { label: "Audit Logs", icon: ScrollText },
  analytics: { label: "Analytics", icon: BarChart3 },
  "content/blog": { label: "Blog (Layout & Engine)", icon: FileText },
  "content/news": { label: "Articles / News", icon: Newspaper },
  "content/events": { label: "Events (Registration)", icon: Calendar },
  branding: { label: "Branding", icon: Palette },
  pages: { label: "Pages", icon: FileStack },
  integrations: { label: "Integrations", icon: Puzzle },
  "research-testing": { label: "Research & Testing", icon: FlaskConical },
  "alerts-security": { label: "Alerts & Security", icon: ShieldAlert },
};

export default function ManagePlaceholder() {
  const location = useLocation();
  const slug = location.pathname.replace(/^\/manage\/?/, "");
  const match = sections[slug];
  const Icon = match?.icon ?? Construction;
  const title = match?.label ?? (slug || "Section");

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">{title} — Coming soon</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        This module will be enabled in the next step.
      </p>
    </div>
  );
}
