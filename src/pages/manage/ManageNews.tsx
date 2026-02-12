import { useState } from "react";
import { Info, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

const mappedSections = [
  "Dispatches From The Frontiers Of AI",
  "Recent Essays",
  "Yangu Studio",
  "Future Of Programming",
  "Putting AI At Work",
];

interface MockArticle {
  id: string;
  title: string;
  author: string;
  status: string;
  date: string;
}

const mockArticles: MockArticle[] = [
  { id: "1", title: "The Rise of African AI Startups", author: "Alice Mwangi", status: "published", date: "2026-02-10" },
  { id: "2", title: "Building with No-Code in 2026", author: "Brian Ochieng", status: "draft", date: "2026-02-09" },
  { id: "3", title: "Yangu Studio: A Deep Dive", author: "Clara Njeri", status: "review", date: "2026-02-08" },
  { id: "4", title: "Future of Programming Languages", author: "David Kamau", status: "published", date: "2026-02-07" },
];

const columns: AdminColumn<MockArticle>[] = [
  { key: "title", header: "Title", render: (r) => <span className="font-medium text-foreground">{r.title}</span> },
  { key: "author", header: "Author", render: (r) => <span className="text-muted-foreground text-sm">{r.author}</span> },
  { key: "date", header: "Date", render: (r) => <span className="text-xs text-muted-foreground">{r.date}</span> },
  { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status === "published" ? "active" : r.status === "review" ? "pending" : "draft"} /> },
];

export default function ManageNews() {
  const [search, setSearch] = useState("");
  const [mappedTo, setMappedTo] = useState(mappedSections[0]);

  const filtered = mockArticles.filter(
    (a) => a.title.toLowerCase().includes(search.toLowerCase()) || a.author.toLowerCase().includes(search.toLowerCase()),
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
              Articles and news feed into Blog sections: <span className="text-foreground font-medium">Dispatches, Recent Essays, Yangu Studio, Future of Programming</span>
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

      <AdminToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search articles…" showFilter />
      <AdminTable columns={columns} data={filtered} rowKey={(r) => r.id} />
    </div>
  );
}
