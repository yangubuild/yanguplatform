import * as React from "react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle, Send } from "lucide-react";
import { useRoles } from "@/hooks/useRoles";

interface MockArticle {
  id: string;
  title: string;
  author: string;
  category: string;
  status: string;
  updatedAt: string;
}

const mockArticles: MockArticle[] = [
  { id: "1", title: "Why Every Business Needs an AI Strategy", author: "Amara K.", category: "Read", status: "published", updatedAt: "2026-02-10" },
  { id: "2", title: "Building Resilient Systems", author: "David M.", category: "Write", status: "draft", updatedAt: "2026-02-11" },
  { id: "3", title: "The Rise of African SaaS", author: "Fatima N.", category: "Read", status: "pending", updatedAt: "2026-02-12" },
  { id: "4", title: "No-Code Tools for Educators", author: "James O.", category: "Write", status: "draft", updatedAt: "2026-02-09" },
  { id: "5", title: "AI Ethics in Practice", author: "Lena P.", category: "Read", status: "published", updatedAt: "2026-02-08" },
];

export function BlogWriteTab() {
  const [search, setSearch] = React.useState("");
  const { isAdmin } = useRoles();

  const filtered = mockArticles.filter(
    (a) => a.title.toLowerCase().includes(search.toLowerCase()) || a.author.toLowerCase().includes(search.toLowerCase())
  );

  const columns: AdminColumn<MockArticle>[] = [
    { key: "title", header: "Title", render: (r) => <span className="font-medium text-sm">{r.title}</span> },
    { key: "author", header: "Author", render: (r) => <span className="text-sm">{r.author}</span> },
    { key: "category", header: "Category", render: (r) => <span className="text-xs text-muted-foreground">{r.category}</span> },
    { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status} /> },
    { key: "updated", header: "Updated", render: (r) => <span className="text-xs text-muted-foreground">{r.updatedAt}</span> },
    {
      key: "actions",
      header: "",
      render: (r) => {
        if (isAdmin && r.status === "pending") {
          return (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                <CheckCircle className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                <Send className="h-3.5 w-3.5" /> Publish
              </Button>
            </div>
          );
        }
        if (r.status === "draft") {
          return (
            <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
              <Send className="h-3.5 w-3.5" /> Submit for Review
            </Button>
          );
        }
        return null;
      },
      className: "w-48",
    },
  ];

  return (
    <div className="space-y-4">
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search articles…"
        showFilter
        right={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Create Draft
          </Button>
        }
      />
      <AdminTable columns={columns} data={filtered} rowKey={(r) => r.id} emptyMessage="No articles found" />
    </div>
  );
}
