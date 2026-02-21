import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgRole } from "@/hooks/useOrgRole";
import { DocsPage } from "@/components/developers/DocsPage";
import { ConsoleDataTable, ColumnDef } from "@/components/developers/console/ConsoleDataTable";
import { Loader2 } from "lucide-react";

interface RateLimitConfig {
  id: string;
  app_id: string;
  bucket_key: string;
  max_requests: number;
  window_seconds: number;
  created_at: string;
  updated_at: string;
}

export default function ConsoleRuntime() {
  const { activeOrg, isLoading: orgLoading, canRead, canWrite } = useOrgRole();

  const { data: limits = [], isLoading } = useQuery({
    queryKey: ["dev-rate-limits", activeOrg?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_rate_limit_config")
        .select("*")
        .order("bucket_key");
      return (data ?? []) as RateLimitConfig[];
    },
    enabled: canRead,
  });

  if (orgLoading) {
    return (
      <DocsPage breadcrumb="Console › Runtime" title="Runtime" subtitle="">
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>
      </DocsPage>
    );
  }

  if (!canRead) {
    return (
      <DocsPage breadcrumb="Console › Runtime" title="Runtime" subtitle="">
        <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <p className="text-white/50 text-sm">You don't have permission to access this page.</p>
        </div>
      </DocsPage>
    );
  }

  const cols: ColumnDef<RateLimitConfig>[] = [
    { header: "Bucket", accessor: "bucket_key" },
    { header: "Max Requests", accessor: (r) => String(r.max_requests) },
    { header: "Window", accessor: (r) => `${r.window_seconds}s` },
    { header: "Updated", accessor: (r) => new Date(r.updated_at).toLocaleDateString() },
  ];

  return (
    <DocsPage breadcrumb="Console › Runtime" title="Runtime" subtitle="Rate limit rules and execution configuration.">
      <ConsoleDataTable
        data={limits}
        columns={cols}
        searchKey="bucket_key"
        searchPlaceholder="Search buckets…"
        isLoading={isLoading}
        canWrite={canWrite}
        emptyMessage="No rate limit rules configured."
      />
    </DocsPage>
  );
}
