import { useState } from "react";
import { Bot } from "lucide-react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { AdminGlassCard } from "@/components/manage/AdminGlassCard";
import { useManageAgents, type ManagedAgent } from "@/hooks/manage/useManageAgents";

const columns: AdminColumn<ManagedAgent>[] = [
  { key: "name", header: "Name", render: (r) => <span className="font-medium text-foreground">{r.name}</span> },
  { key: "model", header: "Model", render: (r) => <span className="text-xs font-mono text-muted-foreground">{r.model ?? "—"}</span> },
  { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status} /> },
  { key: "onboarding_steps", header: "Onboarding Steps", render: (r) => <span className="text-sm text-muted-foreground">{r.onboarding_steps}</span> },
  { key: "description", header: "Description", render: (r) => <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{r.description ?? "—"}</span> },
  { key: "created_at", header: "Created", render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span> },
];

export default function ManageAgents() {
  const [search, setSearch] = useState("");
  const { data: agents = [], isLoading } = useManageAgents();

  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.model ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--admin-surface-elevated)/0.6)]">
          <Bot className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[hsl(var(--admin-text))] font-display">Agents</h1>
          <p className="text-xs text-[hsl(var(--admin-text-muted))]">All AI agents registered on the platform</p>
        </div>
      </div>
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search agents…"
        showFilter
      />
      <AdminTable columns={columns} data={filtered} loading={isLoading} rowKey={(r) => r.id} emptyMessage="No agents registered yet" />
    </div>
  );
}
