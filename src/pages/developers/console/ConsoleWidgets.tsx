import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgRole } from "@/hooks/useOrgRole";
import { DocsPage } from "@/components/developers/DocsPage";
import { ConsoleDataTable, ColumnDef } from "@/components/developers/console/ConsoleDataTable";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface WidgetRow {
  id: string;
  app_id: string;
  widget_key: string;
  title: string;
  description: string | null;
  iframe_url: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export default function ConsoleWidgets() {
  const { activeOrg, isLoading: orgLoading, canRead, canWrite } = useOrgRole();

  const { data: widgets = [], isLoading } = useQuery({
    queryKey: ["dev-widgets", activeOrg?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_widget_registry")
        .select("*")
        .order("widget_key");
      return (data ?? []) as WidgetRow[];
    },
    enabled: canRead,
  });

  if (orgLoading) {
    return (
      <DocsPage breadcrumb="Console › Widgets" title="Widget Registry" subtitle="">
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>
      </DocsPage>
    );
  }

  if (!canRead) {
    return (
      <DocsPage breadcrumb="Console › Widgets" title="Widget Registry" subtitle="">
        <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <p className="text-white/50 text-sm">You don't have permission to access this page.</p>
        </div>
      </DocsPage>
    );
  }

  const cols: ColumnDef<WidgetRow>[] = [
    { header: "Key", accessor: "widget_key" },
    { header: "Title", accessor: "title" },
    {
      header: "Status",
      accessor: (r) => (
        <Badge className={`text-xs ${r.is_enabled ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-white/10 text-white/50 border-white/20"}`}>
          {r.is_enabled ? "Enabled" : "Disabled"}
        </Badge>
      ),
    },
    { header: "Created", accessor: (r) => new Date(r.created_at).toLocaleDateString() },
  ];

  const enabledStr = (r: WidgetRow) => r.is_enabled ? "true" : "false";

  return (
    <DocsPage breadcrumb="Console › Widgets" title="Widget Registry" subtitle="Registered widgets and their configuration.">
      <ConsoleDataTable
        data={widgets}
        columns={cols}
        searchKey="widget_key"
        searchPlaceholder="Search widgets…"
        isLoading={isLoading}
        canWrite={canWrite}
        statusFilter={{ key: "is_enabled" as keyof WidgetRow, options: ["true", "false"] }}
        emptyMessage="No widgets registered."
      />
    </DocsPage>
  );
}
