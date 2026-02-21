import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgRole } from "@/hooks/useOrgRole";
import { DocsPage } from "@/components/developers/DocsPage";
import { ConsoleDataTable, ColumnDef } from "@/components/developers/console/ConsoleDataTable";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface AppScope {
  id?: string;
  app_id: string;
  scope_key: string;
  status: string;
  notes: string | null;
  granted_at: string | null;
}

interface ProviderPerm {
  id: string;
  app_id: string;
  provider_key: string;
  is_active: boolean;
  granted_at: string | null;
}

export default function ConsolePermissions() {
  const { activeOrg, isLoading: orgLoading, canRead, canWrite } = useOrgRole();

  const { data: scopes = [], isLoading: scopesLoading } = useQuery({
    queryKey: ["dev-scopes", activeOrg?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_app_scopes")
        .select("*")
        .order("scope_key");
      return (data ?? []) as AppScope[];
    },
    enabled: canRead,
  });

  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ["dev-provider-perms", activeOrg?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_provider_permissions")
        .select("*")
        .order("provider_key");
      return (data ?? []) as ProviderPerm[];
    },
    enabled: canRead,
  });

  if (orgLoading) {
    return (
      <DocsPage breadcrumb="Console › Permissions" title="Permissions" subtitle="">
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>
      </DocsPage>
    );
  }

  if (!canRead) {
    return (
      <DocsPage breadcrumb="Console › Permissions" title="Permissions" subtitle="">
        <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <p className="text-white/50 text-sm">You don't have permission to access this page.</p>
        </div>
      </DocsPage>
    );
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      approved: "bg-green-500/20 text-green-400 border-green-500/30",
      requested: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      denied: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return <Badge className={`text-xs ${colors[status] || "bg-white/10 text-white/60 border-white/20"}`}>{status}</Badge>;
  };

  const scopeCols: ColumnDef<AppScope>[] = [
    { header: "Scope", accessor: "scope_key" },
    { header: "Status", accessor: (r) => statusBadge(r.status) },
    { header: "Notes", accessor: (r) => r.notes || "—" },
    { header: "Granted", accessor: (r) => r.granted_at ? new Date(r.granted_at).toLocaleDateString() : "—" },
  ];

  const provCols: ColumnDef<ProviderPerm>[] = [
    { header: "Provider", accessor: "provider_key" },
    { header: "Active", accessor: (r) => (
      <Badge className={`text-xs ${r.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
        {r.is_active ? "Active" : "Inactive"}
      </Badge>
    )},
    { header: "Granted", accessor: (r) => r.granted_at ? new Date(r.granted_at).toLocaleDateString() : "—" },
  ];

  return (
    <DocsPage breadcrumb="Console › Permissions" title="Permissions" subtitle="Manage app scopes and provider access.">
      <h2 className="text-lg font-semibold text-white mb-4">App Scopes</h2>
      <ConsoleDataTable
        data={scopes}
        columns={scopeCols}
        searchKey="scope_key"
        searchPlaceholder="Search scopes…"
        isLoading={scopesLoading}
        canWrite={canWrite}
        statusFilter={{ key: "status", options: ["approved", "requested", "denied"] }}
        emptyMessage="No scopes configured."
      />

      <h2 className="text-lg font-semibold text-white mb-4 mt-10">Provider Permissions</h2>
      <ConsoleDataTable
        data={providers}
        columns={provCols}
        searchKey="provider_key"
        searchPlaceholder="Search providers…"
        isLoading={providersLoading}
        canWrite={canWrite}
        emptyMessage="No provider permissions configured."
      />
    </DocsPage>
  );
}
