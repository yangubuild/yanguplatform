import { useState } from "react";
import { Palette } from "lucide-react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { useManageBranding, type ManagedBrandingSurface } from "@/hooks/manage/useManageBranding";

const columns: AdminColumn<ManagedBrandingSurface>[] = [
  { key: "title", header: "Surface", render: (r) => <span className="font-medium text-foreground">{r.title}</span> },
  { key: "slug", header: "Slug", render: (r) => <span className="text-xs font-mono text-muted-foreground">{r.slug}</span> },
  { key: "surface_type", header: "Type", render: (r) => <span className="text-xs text-muted-foreground capitalize">{r.surface_type.replace(/_/g, " ")}</span> },
  { key: "theme", header: "Theme", render: (r) => {
    const t = r.theme as Record<string, unknown> | null;
    if (!t || Object.keys(t).length === 0) return <span className="text-xs text-muted-foreground">Default</span>;
    const keys = Object.keys(t).slice(0, 3).join(", ");
    return <span className="text-xs text-muted-foreground">{keys}{Object.keys(t).length> 3 ? "…" : ""}</span>;
  }},
  { key: "updated_at", header: "Last Updated", render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</span> },
];

export default function ManageBranding() {
  const [search, setSearch] = useState("");
  const { data: surfaces = [], isLoading } = useManageBranding();

  const filtered = surfaces.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--admin-surface-elevated)/0.6)]">
          <Palette className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[hsl(var(--admin-text))] font-display">Branding</h1>
          <p className="text-xs text-[hsl(var(--admin-text-muted))]">Surface themes and brand configuration</p>
        </div>
      </div>
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search surfaces…"
        showFilter
      />
      <AdminTable columns={columns} data={filtered} loading={isLoading} rowKey={(r) => r.id} emptyMessage="No branded surfaces found" />
    </div>
  );
}
