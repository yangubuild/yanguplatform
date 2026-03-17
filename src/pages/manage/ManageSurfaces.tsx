import { useState } from "react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { useManageSurfaces, type ManagedSurface } from "@/hooks/manage/useManageSurfaces";

const columns: AdminColumn<ManagedSurface>[] = [
  { key: "title", header: "Title", render: (r) => <span className="font-medium text-foreground">{r.title}</span> },
  { key: "surface_type", header: "Type", render: (r) => <span className="text-xs text-muted-foreground capitalize">{r.surface_type.replace(/_/g, " ")}</span> },
  { key: "org_name", header: "Org", render: (r) => <span className="text-sm text-muted-foreground">{r.org_name ?? "—"}</span> },
  { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status} /> },
  { key: "domain_host", header: "Domain", render: (r) => <span className="text-muted-foreground text-xs font-mono">{r.domain_host ?? "—"}</span> },
  { key: "draft_slug", header: "Slug", render: (r) => <span className="text-muted-foreground text-xs font-mono">{r.draft_slug ?? "—"}</span> },
];

export default function ManageSurfaces() {
  const [search, setSearch] = useState("");
  const { data: surfaces = [], isLoading } = useManageSurfaces();

  const filtered = surfaces.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.org_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.draft_slug ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search surfaces…"
        showFilter
      />
      <AdminTable columns={columns} data={filtered} loading={isLoading} rowKey={(r) => r.id} />
    </div>
  );
}
