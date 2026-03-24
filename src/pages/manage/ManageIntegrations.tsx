import { useState } from "react";
import { Puzzle, Star, StarOff, Power, PowerOff } from "lucide-react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { useManageIntegrations, type ManagedIntegration } from "@/hooks/manage/useManageIntegrations";
import { useToggleIntegrationStatus, useToggleFeatured } from "@/hooks/manage/useManageIntegrationActions";
import { Button } from "@/components/ui/button";

export default function ManageIntegrations() {
  const [search, setSearch] = useState("");
  const { data: integrations = [], isLoading } = useManageIntegrations();
  const statusMut = useToggleIntegrationStatus();
  const featuredMut = useToggleFeatured();

  const columns: AdminColumn<ManagedIntegration>[] = [
    { key: "name", header: "Name", render: (r) => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">{r.name}</span>
        {r.is_native_yangu && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--admin-accent)/0.15)] text-[hsl(var(--admin-accent))] font-medium">Native</span>}
      </div>
    )},
    { key: "category", header: "Category", render: (r) => <span className="text-xs text-muted-foreground capitalize">{r.category.replace(/_/g, " ")}</span> },
    { key: "provider_name", header: "Provider", render: (r) => <span className="text-sm text-muted-foreground">{r.provider_name}</span> },
    { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status} /> },
    { key: "install_count", header: "Installs", render: (r) => <span className="text-sm text-muted-foreground">{r.install_count}</span> },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1"
            onClick={() => featuredMut.mutate({ appId: r.id, featured: !r.is_featured })}
            disabled={featuredMut.isPending}
            title={r.is_featured ? "Unfeature" : "Feature"}
          >
            {r.is_featured ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 gap-1 ${r.status === "active" ? "text-destructive hover:text-destructive" : "text-success hover:text-success"}`}
            onClick={() => statusMut.mutate({ appId: r.id, status: r.status === "active" ? "inactive" : "active" })}
            disabled={statusMut.isPending}
          >
            {r.status === "active" ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
            {r.status === "active" ? "Disable" : "Enable"}
          </Button>
        </div>
      ),
    },
  ];

  const filtered = integrations.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()) ||
      i.provider_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--admin-surface-elevated)/0.6)]">
          <Puzzle className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[hsl(var(--admin-text))] font-display">Integrations</h1>
          <p className="text-xs text-[hsl(var(--admin-text-muted))]">App registry, connected accounts & install overview</p>
        </div>
      </div>
      <AdminToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search integrations…" showFilter />
      <AdminTable columns={columns} data={filtered} loading={isLoading} rowKey={(r) => r.id} emptyMessage="No integrations in the registry" />
    </div>
  );
}
