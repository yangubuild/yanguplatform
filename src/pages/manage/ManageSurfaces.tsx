import { useState } from "react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";

interface MockSurface {
  id: string;
  title: string;
  owner: string;
  state: string;
  domain: string;
}

const mockSurfaces: MockSurface[] = [
  { id: "1", title: "Nairobi Crafts Store", owner: "Alice Mwangi", state: "published", domain: "shop.yangu.com" },
  { id: "2", title: "TechBuild Portfolio", owner: "Brian Ochieng", state: "draft", domain: "site.yangu.com" },
  { id: "3", title: "Savanna Live", owner: "Clara Njeri", state: "active", domain: "live.yangu.com" },
  { id: "4", title: "Digital Academy", owner: "David Kamau", state: "archived", domain: "community.yangu.com" },
  { id: "5", title: "Mama's Kitchen", owner: "Eve Wanjiku", state: "verifying", domain: "store.yangu.com" },
];

const columns: AdminColumn<MockSurface>[] = [
  { key: "title", header: "Title", render: (r) => <span className="font-medium text-foreground">{r.title}</span> },
  { key: "owner", header: "Owner", render: (r) => r.owner },
  { key: "state", header: "State", render: (r) => <AdminStatusBadge status={r.state} /> },
  { key: "domain", header: "Domain", render: (r) => <span className="text-muted-foreground text-xs font-mono">{r.domain}</span> },
];

export default function ManageSurfaces() {
  const [search, setSearch] = useState("");
  const filtered = mockSurfaces.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.owner.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search surfaces…"
        showFilter
      />
      <AdminTable columns={columns} data={filtered} rowKey={(r) => r.id} />
    </div>
  );
}
