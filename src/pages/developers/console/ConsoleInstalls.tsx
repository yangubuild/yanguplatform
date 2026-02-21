import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgRole } from "@/hooks/useOrgRole";
import { DocsPage } from "@/components/developers/DocsPage";
import { ConsoleDataTable, ColumnDef } from "@/components/developers/console/ConsoleDataTable";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface InstallRow {
  id: string;
  install_id: string;
  surface_id: string;
  widget_key: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ConsoleInstalls() {
  const { activeOrg, isLoading: orgLoading, canRead, canWrite } = useOrgRole();

  const { data: installs = [], isLoading } = useQuery({
    queryKey: ["dev-installs", activeOrg?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_surface_installs")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as InstallRow[];
    },
    enabled: canRead,
  });

  if (orgLoading) {
    return (
      <DocsPage breadcrumb="Console › Installs" title="Surface Installs" subtitle="">
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>
      </DocsPage>
    );
  }

  if (!canRead) {
    return (
      <DocsPage breadcrumb="Console › Installs" title="Surface Installs" subtitle="">
        <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <p className="text-white/50 text-sm">You don't have permission to access this page.</p>
        </div>
      </DocsPage>
    );
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      enabled: "bg-green-500/20 text-green-400 border-green-500/30",
      disabled: "bg-white/10 text-white/50 border-white/20",
      revoked: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return <Badge className={`text-xs ${colors[status] || "bg-white/10 text-white/60 border-white/20"}`}>{status}</Badge>;
  };

  const cols: ColumnDef<InstallRow>[] = [
    { header: "Widget Key", accessor: "widget_key" },
    { header: "Surface ID", accessor: (r) => <span className="font-mono text-xs">{r.surface_id.slice(0, 8)}…</span> },
    { header: "Status", accessor: (r) => statusBadge(r.status) },
    { header: "Created", accessor: (r) => new Date(r.created_at).toLocaleDateString() },
  ];

  return (
    <DocsPage breadcrumb="Console › Installs" title="Surface Installs" subtitle="Widget installations on surfaces.">
      <ConsoleDataTable
        data={installs}
        columns={cols}
        searchKey="widget_key"
        searchPlaceholder="Search installs…"
        isLoading={isLoading}
        canWrite={canWrite}
        statusFilter={{ key: "status", options: ["active", "enabled", "disabled", "revoked"] }}
        emptyMessage="No surface installs found."
      />
    </DocsPage>
  );
}
