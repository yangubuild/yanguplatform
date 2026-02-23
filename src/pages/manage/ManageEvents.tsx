import { useState } from "react";
import { Info } from "lucide-react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const mappedSections = ["yangu Events"];

interface MockEvent {
  id: string;
  title: string;
  date: string;
  registrations: number;
  status: string;
}

const mockEvents: MockEvent[] = [
  { id: "1", title: "AI Tech Week", date: "2026-07-10", registrations: 340, status: "active" },
  { id: "2", title: "Builders & Sellers Event", date: "2026-07-15", registrations: 120, status: "active" },
  { id: "3", title: "Influencers Live Stream", date: "2026-07-20", registrations: 85, status: "draft" },
  { id: "4", title: "Developers Community Meetup", date: "2026-07-25", registrations: 0, status: "pending" },
];

const columns: AdminColumn<MockEvent>[] = [
  { key: "title", header: "Event", render: (r) => <span className="font-medium text-foreground">{r.title}</span> },
  { key: "date", header: "Date", render: (r) => <span className="text-xs text-muted-foreground">{r.date}</span> },
  { key: "registrations", header: "Registrations", render: (r) => <span className="text-sm font-mono">{r.registrations}</span> },
  { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status} /> },
];

export default function ManageEvents() {
  const [search, setSearch] = useState("");
  const [mappedTo, setMappedTo] = useState(mappedSections[0]);

  const filtered = mockEvents.filter(
    (e) => e.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* Mapping Banner */}
      <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-accent mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Content Feed Mapping</p>
            <p className="text-xs text-muted-foreground">
              Events feed into the Blog section: <span className="text-foreground font-medium">yangu Events</span> block
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Mapped To Section:</span>
          <Select value={mappedTo} onValueChange={setMappedTo}>
            <SelectTrigger className="w-64 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mappedSections.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <AdminToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search events…" showFilter />
      <AdminTable columns={columns} data={filtered} rowKey={(r) => r.id} />
    </div>
  );
}
