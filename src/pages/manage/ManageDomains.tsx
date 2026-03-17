import { useState } from "react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { useManageDomains, type ManagedDomain } from "@/hooks/manage/useManageDomains";

const columns: AdminColumn<ManagedDomain>[] = [
  { key: "host", header: "Host", render: (r) => <span className="font-medium font-mono text-sm text-foreground">{r.host}</span> },
  { key: "domain_type", header: "Type", render: (r) => <span className="text-xs text-muted-foreground capitalize">{r.domain_type}</span> },
  { key: "kind", header: "Kind", render: (r) => <span className="text-xs text-muted-foreground capitalize">{r.kind}</span> },
  { key: "platform_key", header: "Platform Key", render: (r) => <span className="text-xs font-mono text-muted-foreground">{r.platform_key ?? "—"}</span> },
  { key: "is_active", header: "Status", render: (r) => <AdminStatusBadge status={r.is_active ? "active" : "inactive"} /> },
];

export default function ManageDomains() {
  const [search, setSearch] = useState("");
  const { data: domains = [], isLoading } = useManageDomains();

  const filtered = domains.filter(
    (d) =>
      d.host.toLowerCase().includes(search.toLowerCase()) ||
      (d.platform_key ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search domains…"
        showFilter
      />
      <AdminTable columns={columns} data={filtered} loading={isLoading} rowKey={(r) => r.id} />
    </div>
  );
}
