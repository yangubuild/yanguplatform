import * as React from "react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Calendar } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BlogEventEditor } from "./BlogEventEditor";

/* ---- Video/Image Table ---- */
interface MockMedia {
  id: string;
  title: string;
  videoLink: string;
  description: string;
  status: string;
}

const mockMedia: MockMedia[] = [
  { id: "1", title: "Yangu Platform Demo", videoLink: "https://youtube.com/watch?v=abc", description: "Full walkthrough of the platform.", status: "published" },
  { id: "2", title: "AI Agent Tutorial", videoLink: "https://youtube.com/watch?v=def", description: "How to build your first AI agent.", status: "draft" },
  { id: "3", title: "Studio Showcase", videoLink: "", description: "Creative assets generated with Studio.", status: "pending" },
];

const mediaCols: AdminColumn<MockMedia>[] = [
  { key: "img", header: "Image", render: () => <div className="h-10 w-10 rounded-md bg-muted border border-border" />, className: "w-16" },
  { key: "title", header: "Title", render: (r) => <span className="font-medium text-sm">{r.title}</span> },
  { key: "link", header: "Video Link", render: (r) => <span className="text-xs text-muted-foreground truncate max-w-[160px] block">{r.videoLink || "—"}</span> },
  { key: "desc", header: "Description", render: (r) => <span className="text-xs text-muted-foreground line-clamp-1">{r.description}</span> },
  { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status} /> },
  { key: "actions", header: "", render: () => <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>, className: "w-16" },
];

/* ---- Events Table ---- */
interface MockEvent {
  id: string;
  title: string;
  date: string;
  regLink: string;
  status: string;
}

const mockEvents: MockEvent[] = [
  { id: "1", title: "AI Tech Week", date: "Jul 7–11, 2026", regLink: "https://example.com/register", status: "active" },
  { id: "2", title: "Builders & Sellers Summit", date: "Jul 14, 2026", regLink: "", status: "draft" },
  { id: "3", title: "Influencers Live Stream", date: "Jul 21, 2026", regLink: "https://example.com/live", status: "active" },
  { id: "4", title: "Developers Community Day", date: "Jul 28, 2026", regLink: "", status: "pending" },
];

const eventCols: AdminColumn<MockEvent>[] = [
  { key: "img", header: "Image", render: () => <div className="h-10 w-10 rounded-md bg-muted border border-border" />, className: "w-16" },
  { key: "title", header: "Event Title", render: (r) => <span className="font-medium text-sm">{r.title}</span> },
  { key: "date", header: "Date", render: (r) => <span className="text-xs text-muted-foreground">{r.date}</span> },
  { key: "reg", header: "Registration", render: (r) => <span className="text-xs text-muted-foreground truncate max-w-[140px] block">{r.regLink || "—"}</span> },
  { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status} /> },
  { key: "actions", header: "", render: () => <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>, className: "w-16" },
];

export function BlogWatchTab() {
  const [mediaSearch, setMediaSearch] = React.useState("");
  const [eventSearch, setEventSearch] = React.useState("");
  const [eventEditorOpen, setEventEditorOpen] = React.useState(false);

  const filteredMedia = mockMedia.filter((m) => m.title.toLowerCase().includes(mediaSearch.toLowerCase()));
  const filteredEvents = mockEvents.filter((e) => e.title.toLowerCase().includes(eventSearch.toLowerCase()));

  return (
    <Tabs defaultValue="videos" className="space-y-4">
      <TabsList className="bg-muted/50">
        <TabsTrigger value="videos" className="text-xs">Videos & Images</TabsTrigger>
        <TabsTrigger value="events" className="text-xs gap-1.5">
          <Calendar className="h-3.5 w-3.5" /> Events
        </TabsTrigger>
      </TabsList>

      <TabsContent value="videos" className="space-y-4">
        <AdminToolbar
          search={mediaSearch}
          onSearchChange={setMediaSearch}
          searchPlaceholder="Search media…"
          right={<Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Media</Button>}
        />
        <AdminTable columns={mediaCols} data={filteredMedia} rowKey={(r) => r.id} emptyMessage="No media found" />
      </TabsContent>

      <TabsContent value="events" className="space-y-4">
        <AdminToolbar
          search={eventSearch}
          onSearchChange={setEventSearch}
          searchPlaceholder="Search events…"
          right={<Button size="sm" className="gap-1.5" onClick={() => setEventEditorOpen(true)}><Plus className="h-3.5 w-3.5" /> Add Event</Button>}
        />
        <AdminTable columns={eventCols} data={filteredEvents} rowKey={(r) => r.id} emptyMessage="No events found" />
        <BlogEventEditor open={eventEditorOpen} onOpenChange={setEventEditorOpen} />
      </TabsContent>
    </Tabs>
  );
}
