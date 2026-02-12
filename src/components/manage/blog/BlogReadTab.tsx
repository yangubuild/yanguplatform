import * as React from "react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { Pencil, Eye } from "lucide-react";
import { BlogContentCardEditor } from "./BlogContentCardEditor";

interface MockContent {
  id: string;
  title: string;
  section: string;
  author: string;
  status: string;
  views: number;
}

const mockContent: MockContent[] = [
  { id: "1", title: "Dispatches: AI Frontier Report", section: "Dispatches", author: "Amara K.", status: "published", views: 1240 },
  { id: "2", title: "The Quiet Revolution of Small LLMs", section: "Recent Essays", author: "David M.", status: "published", views: 890 },
  { id: "3", title: "Yangu Studio Launch Recap", section: "Yangu Studio", author: "Fatima N.", status: "draft", views: 0 },
  { id: "4", title: "Automating Customer Support", section: "Putting AI At Work", author: "James O.", status: "published", views: 2100 },
  { id: "5", title: "Rust vs Go for AI Infra", section: "Future Of Programming", author: "Lena P.", status: "pending", views: 0 },
];

export function BlogReadTab() {
  const [search, setSearch] = React.useState("");
  const [editorOpen, setEditorOpen] = React.useState(false);

  const filtered = mockContent.filter(
    (c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.section.toLowerCase().includes(search.toLowerCase())
  );

  const columns: AdminColumn<MockContent>[] = [
    { key: "title", header: "Title", render: (r) => <span className="font-medium text-sm">{r.title}</span> },
    { key: "section", header: "Section", render: (r) => <span className="text-xs text-muted-foreground">{r.section}</span> },
    { key: "author", header: "Author", render: (r) => <span className="text-sm">{r.author}</span> },
    { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status} /> },
    { key: "views", header: "Views", render: (r) => <span className="text-xs tabular-nums text-muted-foreground">{r.views.toLocaleString()}</span> },
    {
      key: "actions",
      header: "",
      render: () => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditorOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
      className: "w-24",
    },
  ];

  return (
    <div className="space-y-4">
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search published content…"
        showFilter
      />
      <AdminTable columns={columns} data={filtered} rowKey={(r) => r.id} emptyMessage="No content found" />
      <BlogContentCardEditor open={editorOpen} onOpenChange={setEditorOpen} title="Edit Content Card" />
    </div>
  );
}
