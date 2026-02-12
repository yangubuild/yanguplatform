import { useParams } from "react-router-dom";
import {
  Users,
  Layers,
  Megaphone,
  Bot,
  Globe,
  Settings,
  ScrollText,
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
};

export default function ManagePlaceholder() {
  const { section } = useParams<{ section: string }>();
  const match = sections[section ?? ""];
  const Icon = match?.icon ?? Construction;
  const title = match?.label ?? section ?? "Section";

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
