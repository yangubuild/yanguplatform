import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";
import { ENTITY_TYPE_CONFIG } from "@/types/search";
import type { SearchableEntityType } from "@/types/search";

interface ReportRow {
  id: string;
  entity_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  // joined
  entity_title: string | null;
  entity_type: string | null;
  entity_slug: string | null;
}

function useManageReports() {
  return useQuery({
    queryKey: ["manage_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_reports")
        .select("*, searchable_entities!entity_reports_entity_id_fkey(title, entity_type, slug)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        entity_id: r.entity_id,
        reporter_id: r.reporter_id,
        reason: r.reason,
        details: r.details,
        status: r.status,
        admin_notes: r.admin_notes,
        created_at: r.created_at,
        entity_title: r.searchable_entities?.title ?? null,
        entity_type: r.searchable_entities?.entity_type ?? null,
        entity_slug: r.searchable_entities?.slug ?? null,
      })) as ReportRow[];
    },
  });
}

function getEntityDetailPath(type: string | null, slug: string | null): string | null {
  if (!slug) return null;
  const config = type ? ENTITY_TYPE_CONFIG[type as SearchableEntityType] : null;
  return config ? `${config.detailRoute}/${slug}` : `/discover/${slug}`;
}

export default function ManageReports() {
  const { data: reports, isLoading } = useManageReports();

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-foreground mb-6">Entity Reports</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !reports || reports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No reports yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Entity</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Reason</th>
                <th className="pb-2 pr-4">Details</th>
                <th className="pb-2 pr-4">Reporter</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Link</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const detailPath = getEntityDetailPath(r.entity_type, r.entity_slug);
                return (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-2 pr-4 text-foreground font-medium max-w-[180px] truncate">{r.entity_title || r.entity_id.slice(0, 8)}</td>
                    <td className="py-2 pr-4">
                      {r.entity_type && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {ENTITY_TYPE_CONFIG[r.entity_type as SearchableEntityType]?.label || r.entity_type}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-foreground">{r.reason}</td>
                    <td className="py-2 pr-4 text-muted-foreground max-w-[200px] truncate">{r.details || "—"}</td>
                    <td className="py-2 pr-4 text-muted-foreground text-xs font-mono">{r.reporter_id.slice(0, 8)}…</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                        r.status === "resolved" ? "bg-green-500/10 text-green-500" :
                        r.status === "dismissed" ? "bg-muted text-muted-foreground" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {detailPath && (
                        <a href={detailPath} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
