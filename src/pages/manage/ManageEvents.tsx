import { useState } from "react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { useManageEvents, type EventOverview } from "@/hooks/manage/useManageEvents";

const columns: AdminColumn<EventOverview>[] = [
  { key: "event_type", header: "Event Type", render: (r) => <span className="font-medium text-foreground">{r.event_type}</span> },
  { key: "event_count", header: "Count", render: (r) => <span className="text-sm font-mono">{r.event_count}</span> },
  { key: "last_seen", header: "Last Seen", render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.last_seen).toLocaleString()}</span> },
];

export default function ManageEvents() {
  const [search, setSearch] = useState("");
  const { data: events = [], isLoading } = useManageEvents();

  const filtered = events.filter(
    (e) => e.event_type.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <AdminToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search events…" showFilter />
      <AdminTable columns={columns} data={filtered} loading={isLoading} rowKey={(r) => r.event_type} emptyMessage="No discovery events recorded" />
    </div>
  );
}
