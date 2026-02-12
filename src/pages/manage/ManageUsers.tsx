import { useState } from "react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

const mockUsers: MockUser[] = [
  { id: "1", name: "Alice Mwangi", email: "alice@example.com", role: "admin", status: "active" },
  { id: "2", name: "Brian Ochieng", email: "brian@example.com", role: "user", status: "active" },
  { id: "3", name: "Clara Njeri", email: "clara@example.com", role: "user", status: "paused" },
  { id: "4", name: "David Kamau", email: "david@example.com", role: "user", status: "pending" },
  { id: "5", name: "Eve Wanjiku", email: "eve@example.com", role: "admin", status: "active" },
];

const columns: AdminColumn<MockUser>[] = [
  { key: "name", header: "Name", render: (r) => <span className="font-medium text-foreground">{r.name}</span> },
  { key: "email", header: "Email", render: (r) => <span className="text-muted-foreground">{r.email}</span> },
  { key: "role", header: "Role", render: (r) => <span className="capitalize">{r.role}</span> },
  { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status} /> },
];

export default function ManageUsers() {
  const [search, setSearch] = useState("");
  const filtered = mockUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users…"
        showFilter
      />
      <AdminTable columns={columns} data={filtered} rowKey={(r) => r.id} />
    </div>
  );
}
