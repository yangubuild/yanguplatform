import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EntityReport {
  id: string;
  entity_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

function useManageReports() {
  return useQuery({
    queryKey: ["manage_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as EntityReport[];
    },
  });
}

export default function ManageReports() {
  const { data: reports, isLoading } = useManageReports();

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-foreground mb-6">Entity Reports</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !reports || reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reports yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Reason</th>
                <th className="pb-2 pr-4">Details</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Entity ID</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="py-2 pr-4 text-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="py-2 pr-4 text-foreground">{r.reason}</td>
                  <td className="py-2 pr-4 text-muted-foreground max-w-[200px] truncate">{r.details || "—"}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "pending" ? "bg-yellow-500/10 text-yellow-500" : r.status === "resolved" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2 text-muted-foreground text-xs font-mono">{r.entity_id.slice(0, 8)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
