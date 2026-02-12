import * as React from "react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Send } from "lucide-react";

interface MockPodcast {
  id: string;
  image: string;
  title: string;
  description: string;
  audioLink: string;
  status: string;
}

const mockPodcasts: MockPodcast[] = [
  { id: "1", image: "", title: "The Future of AI Agents", description: "Exploring autonomous AI systems and their impact on work.", audioLink: "https://example.com/ep1.mp3", status: "published" },
  { id: "2", image: "", title: "Building in Public", description: "Why transparency is the new competitive advantage.", audioLink: "https://example.com/ep2.mp3", status: "draft" },
  { id: "3", image: "", title: "African Tech Renaissance", description: "The rise of tech ecosystems across the continent.", audioLink: "https://example.com/ep3.mp3", status: "published" },
  { id: "4", image: "", title: "No-Code Revolution", description: "How no-code tools are democratizing software.", audioLink: "", status: "pending" },
];

const columns: AdminColumn<MockPodcast>[] = [
  {
    key: "image",
    header: "Image",
    render: () => (
      <div className="h-10 w-10 rounded-md bg-muted border border-border" />
    ),
    className: "w-16",
  },
  { key: "title", header: "Episode Title", render: (r) => <span className="font-medium text-sm">{r.title}</span> },
  { key: "description", header: "Description", render: (r) => <span className="text-xs text-muted-foreground line-clamp-1">{r.description}</span> },
  { key: "audio", header: "Audio Link", render: (r) => <span className="text-xs text-muted-foreground truncate max-w-[140px] block">{r.audioLink || "—"}</span> },
  { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status} /> },
  {
    key: "actions",
    header: "",
    render: () => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7"><Send className="h-3.5 w-3.5" /></Button>
      </div>
    ),
    className: "w-24",
  },
];

export function BlogListenTab() {
  const [search, setSearch] = React.useState("");
  const filtered = mockPodcasts.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search podcasts…"
        right={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Podcast
          </Button>
        }
      />
      <AdminTable columns={columns} data={filtered} rowKey={(r) => r.id} emptyMessage="No podcasts found" />
    </div>
  );
}
