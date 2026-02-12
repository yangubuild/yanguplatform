import { useState } from "react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Flame, MousePointerClick } from "lucide-react";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  kycStatus: string;
  segment: string;
  lastLogin: string;
  sessions: number;
  engagement: number;
  clicks: number;
  pageVisits: number;
}

const segmentColor: Record<string, string> = {
  Builder: "bg-accent/10 text-accent border-accent/20",
  Seller: "bg-warning/10 text-warning border-warning/20",
  Organization: "bg-primary/10 text-primary border-primary/20",
  Creator: "bg-success/10 text-success border-success/20",
  Viewer: "bg-muted text-muted-foreground border-border",
};

const mockUsers: MockUser[] = [
  { id: "1", name: "Alice Mwangi", email: "alice@example.com", role: "admin", status: "active", kycStatus: "approved", segment: "Builder", lastLogin: "2h ago", sessions: 142, engagement: 92, clicks: 1840, pageVisits: 320 },
  { id: "2", name: "Brian Ochieng", email: "brian@example.com", role: "user", status: "active", kycStatus: "approved", segment: "Seller", lastLogin: "4h ago", sessions: 87, engagement: 78, clicks: 960, pageVisits: 210 },
  { id: "3", name: "Clara Njeri", email: "clara@example.com", role: "user", status: "paused", kycStatus: "pending", segment: "Organization", lastLogin: "1d ago", sessions: 23, engagement: 45, clicks: 340, pageVisits: 88 },
  { id: "4", name: "David Kamau", email: "david@example.com", role: "user", status: "pending", kycStatus: "submitted", segment: "Creator", lastLogin: "3d ago", sessions: 56, engagement: 61, clicks: 720, pageVisits: 155 },
  { id: "5", name: "Eve Wanjiku", email: "eve@example.com", role: "admin", status: "active", kycStatus: "approved", segment: "Builder", lastLogin: "1h ago", sessions: 234, engagement: 95, clicks: 2100, pageVisits: 480 },
  { id: "6", name: "Frank Otieno", email: "frank@example.com", role: "user", status: "active", kycStatus: "rejected", segment: "Viewer", lastLogin: "12h ago", sessions: 11, engagement: 18, clicks: 90, pageVisits: 22 },
];

function EngagementBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-success" : value >= 50 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{value}</span>
    </div>
  );
}

const columns: AdminColumn<MockUser>[] = [
  { key: "name", header: "Name", render: (r) => <span className="font-medium text-foreground">{r.name}</span> },
  { key: "email", header: "Email", render: (r) => <span className="text-muted-foreground text-xs">{r.email}</span> },
  { key: "segment", header: "Segment", render: (r) => (
    <Badge variant="outline" className={`text-[10px] ${segmentColor[r.segment] ?? ""}`}>{r.segment}</Badge>
  )},
  { key: "kycStatus", header: "KYC", render: (r) => <AdminStatusBadge status={r.kycStatus === "approved" ? "active" : r.kycStatus === "rejected" ? "rejected" : "pending"} /> },
  { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status} /> },
  { key: "lastLogin", header: "Last Login", render: (r) => <span className="text-xs text-muted-foreground">{r.lastLogin}</span> },
  { key: "sessions", header: "Sessions", render: (r) => <span className="text-xs font-mono">{r.sessions}</span> },
  { key: "engagement", header: "Engagement", render: (r) => <EngagementBar value={r.engagement} /> },
  { key: "clicks", header: "Clicks", render: (r) => (
    <span className="text-xs text-muted-foreground flex items-center gap-1">
      <MousePointerClick className="h-3 w-3" />{r.clicks.toLocaleString()}
    </span>
  )},
  { key: "pageVisits", header: "Pages", render: (r) => <span className="text-xs font-mono">{r.pageVisits}</span> },
];

export default function ManageUsers() {
  const [search, setSearch] = useState("");
  const filtered = mockUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.segment.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users by name, email, or segment…"
        showFilter
      />
      <AdminTable columns={columns} data={filtered} rowKey={(r) => r.id} />
    </div>
  );
}
