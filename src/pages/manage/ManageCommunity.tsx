import { useState } from "react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { useManageCommunity, type CommunityPromo } from "@/hooks/manage/useManageCommunity";

const columns: AdminColumn<CommunityPromo>[] = [
  { key: "section", header: "Section", render: (r) => <span className="font-medium text-foreground capitalize">{r.section}</span> },
  { key: "surface_title", header: "Surface", render: (r) => <span className="text-sm text-muted-foreground">{r.surface_title ?? "—"}</span> },
  { key: "category_key", header: "Category", render: (r) => <span className="text-xs text-muted-foreground">{r.category_key ?? "—"}</span> },
  { key: "tier", header: "Tier", render: (r) => <span className="text-xs font-mono">{r.tier}</span> },
  { key: "is_active", header: "Status", render: (r) => <AdminStatusBadge status={r.is_active ? "active" : "inactive"} /> },
  { key: "starts_at", header: "Start", render: (r) => <span className="text-muted-foreground text-xs">{new Date(r.starts_at).toLocaleDateString()}</span> },
  { key: "ends_at", header: "End", render: (r) => <span className="text-muted-foreground text-xs">{r.ends_at ? new Date(r.ends_at).toLocaleDateString() : "—"}</span> },
];

export default function ManageCommunity() {
  const [search, setSearch] = useState("");
  const { data: promos = [], isLoading } = useManageCommunity();

  const filtered = promos.filter(
    (p) =>
      p.section.toLowerCase().includes(search.toLowerCase()) ||
      (p.surface_title ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search promotions…"
        showFilter
      />
      <AdminTable columns={columns} data={filtered} loading={isLoading} rowKey={(r) => r.id} emptyMessage="No community promotions found" />
    </div>
  );
}
