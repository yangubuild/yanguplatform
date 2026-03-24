import { useState } from "react";
import { ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { useManageCommunity, type CommunityPromo } from "@/hooks/manage/useManageCommunity";
import { useTogglePromo, useDeletePromo } from "@/hooks/manage/useManageCommunityActions";
import { Button } from "@/components/ui/button";

export default function ManageCommunity() {
  const [search, setSearch] = useState("");
  const { data: promos = [], isLoading } = useManageCommunity();
  const toggleMut = useTogglePromo();
  const deleteMut = useDeletePromo();

  const columns: AdminColumn<CommunityPromo>[] = [
    { key: "section", header: "Section", render: (r) => <span className="font-medium text-foreground capitalize">{r.section}</span> },
    { key: "surface_title", header: "Surface", render: (r) => <span className="text-sm text-muted-foreground">{r.surface_title ?? "—"}</span> },
    { key: "category_key", header: "Category", render: (r) => <span className="text-xs text-muted-foreground">{r.category_key ?? "—"}</span> },
    { key: "tier", header: "Tier", render: (r) => <span className="text-xs font-mono">{r.tier}</span> },
    { key: "is_active", header: "Status", render: (r) => <AdminStatusBadge status={r.is_active ? "active" : "inactive"} /> },
    { key: "starts_at", header: "Start", render: (r) => <span className="text-muted-foreground text-xs">{new Date(r.starts_at).toLocaleDateString()}</span> },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1"
            onClick={() => toggleMut.mutate({ promoId: r.id, active: !r.is_active })}
            disabled={toggleMut.isPending}
          >
            {r.is_active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
            {r.is_active ? "Disable" : "Enable"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm("Delete this promotion?")) deleteMut.mutate(r.id);
            }}
            disabled={deleteMut.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const filtered = promos.filter(
    (p) =>
      p.section.toLowerCase().includes(search.toLowerCase()) ||
      (p.surface_title ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <AdminToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search promotions…" showFilter />
      <AdminTable columns={columns} data={filtered} loading={isLoading} rowKey={(r) => r.id} emptyMessage="No community promotions found" />
    </div>
  );
}
