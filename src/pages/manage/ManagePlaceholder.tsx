import { useParams } from "react-router-dom";
import { Construction } from "lucide-react";

const labels: Record<string, string> = {
  users: "Users",
  surfaces: "Surfaces",
  community: "Community (Promotions)",
  agents: "Agents",
  domains: "Domains",
  settings: "Settings",
  "audit-logs": "Audit Logs",
};

export default function ManagePlaceholder() {
  const { section } = useParams<{ section: string }>();
  const title = labels[section ?? ""] ?? section ?? "Section";

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <Construction className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-muted-foreground">This module is coming soon.</p>
    </div>
  );
}
