import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DocsPage } from "@/components/developers/DocsPage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Activity } from "lucide-react";

export default function PortalLogs() {
  const { user } = useAuth();
  const [selectedApp, setSelectedApp] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");

  const { data: apps } = useQuery({
    queryKey: ["portal-apps-logs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_apps")
        .select("id, name")
        .order("name");
      return data ?? [];
    },
  });

  // Fetch runtime audit logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ["portal-logs", selectedApp, eventFilter],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("developer_runtime_audit")
        .select("*, developer_apps!inner(name, owner_user_id)")
        .eq("developer_apps.owner_user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (selectedApp !== "all") q = q.eq("app_id", selectedApp);
      if (eventFilter !== "all") q = q.eq("action", eventFilter);
      const { data } = await q;
      return data ?? [];
    },
  });

  // Fetch webhook delivery logs
  const { data: deliveries } = useQuery({
    queryKey: ["portal-webhook-deliveries", selectedApp],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("developer_webhook_deliveries")
        .select("*, developer_apps!inner(name, owner_user_id)")
        .eq("developer_apps.owner_user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (selectedApp !== "all") q = q.eq("app_id", selectedApp);
      const { data } = await q;
      return data ?? [];
    },
  });

  const actionEvents = [...new Set((logs ?? []).map((l: any) => l.action))];

  return (
    <DocsPage breadcrumb="Portal" title="Logs" subtitle="View runtime activity and webhook delivery logs.">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={selectedApp} onValueChange={setSelectedApp}>
          <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-foreground text-sm">
            <SelectValue placeholder="All Apps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Apps</SelectItem>
            {apps?.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-foreground text-sm">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {actionEvents.map((ev) => (
              <SelectItem key={ev} value={ev}>{ev}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Runtime Audit Logs */}
      <div className="mb-8">
        <h3 className="text-foreground font-semibold text-sm mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: "#F46D2A" }} />
          Runtime Activity
        </h3>
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !logs?.length ? (
            <div className="text-center py-12">
              <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No runtime logs yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Action</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs hidden sm:table-cell">App</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs hidden md:table-cell">Details</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs border-white/20 text-muted-foreground">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                      {log.developer_apps?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs font-mono hidden md:table-cell truncate max-w-[200px]">
                      {log.details ? JSON.stringify(log.details).slice(0, 80) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Webhook Deliveries */}
      <div>
        <h3 className="text-foreground font-semibold text-sm mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" style={{ color: "#F46D2A" }} />
          Webhook Deliveries
        </h3>
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          {!deliveries?.length ? (
            <div className="text-center py-12">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No webhook deliveries yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Event</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs hidden md:table-cell">HTTP</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Time</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d: any) => (
                  <tr key={d.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs border-white/20 text-muted-foreground">
                        {d.event_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-medium ${
                        d.status === "delivered" ? "text-emerald-400" :
                        d.status === "failed" ? "text-red-400" : "text-yellow-400"
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs font-mono hidden md:table-cell">
                      {d.http_status ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DocsPage>
  );
}
