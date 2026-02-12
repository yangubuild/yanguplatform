import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";

interface MockPromo {
  id: string;
  name: string;
  placement: string;
  status: string;
  start: string;
  end: string;
}

const mockPromos: MockPromo[] = [
  { id: "1", name: "Holiday Feature", placement: "hero", status: "active", start: "2026-01-15", end: "2026-02-28" },
  { id: "2", name: "New Sellers Push", placement: "trending", status: "active", start: "2026-02-01", end: "2026-03-01" },
  { id: "3", name: "Spring Campaign", placement: "spotlight", status: "draft", start: "2026-03-01", end: "2026-04-15" },
  { id: "4", name: "Black Friday '25", placement: "hero", status: "archived", start: "2025-11-20", end: "2025-12-01" },
  { id: "5", name: "Creator Week", placement: "featured", status: "paused", start: "2026-02-05", end: "2026-02-12" },
];

const columns: AdminColumn<MockPromo>[] = [
  { key: "name", header: "Promo Name", render: (r) => <span className="font-medium text-foreground">{r.name}</span> },
  { key: "placement", header: "Placement", render: (r) => <span className="capitalize">{r.placement}</span> },
  { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status} /> },
  { key: "start", header: "Start", render: (r) => <span className="text-muted-foreground text-xs font-mono">{r.start}</span> },
  { key: "end", header: "End", render: (r) => <span className="text-muted-foreground text-xs font-mono">{r.end}</span> },
];

export default function ManageCommunity() {
  const [search, setSearch] = useState("");
  const filtered = mockPromos.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.placement.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search promotions…"
        showFilter
        right={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Create
          </Button>
        }
      />
      <AdminTable columns={columns} data={filtered} rowKey={(r) => r.id} />
    </div>
  );
}
