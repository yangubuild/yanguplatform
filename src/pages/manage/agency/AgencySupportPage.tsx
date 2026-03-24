import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useAgencySupportTickets } from "@/hooks/manage/useAgencySupportTickets";
import { useRoles } from "@/hooks/useRoles";
import { useState } from "react";
import { MessageSquare } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  replied: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  resolved: "bg-green-500/10 text-green-600 border-green-500/20",
  escalated: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function AgencySupport() {
  const { isAgencyAdmin, isAgencyManager, isAdmin } = useRoles();
  const isLeader = isAdmin || isAgencyAdmin || isAgencyManager;
  const { data: ctx, isLoading: ctxLoading } = useAgencyContext();
  const agencyId = ctx?.agency_id;
  const { data: tickets, isLoading } = useAgencySupportTickets(isLeader ? agencyId : undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!isLeader) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <h2 className="text-lg font-semibold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-xs">Support is available for agency admins and managers only.</p>
      </div>
    );
  }

  if (ctxLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  const selected = tickets?.find((t) => t.id === selectedId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Support</h1>
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">Tickets from agency members · {tickets?.length ?? 0} total</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">From</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(tickets?.length ?? 0) === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No tickets</td></tr>
                  ) : (
                    tickets!.map((t) => (
                      <tr
                        key={t.id}
                        className={`hover:bg-muted/30 cursor-pointer ${selectedId === t.id ? "bg-muted/40" : ""}`}
                        onClick={() => setSelectedId(t.id)}>
                        <td className="px-4 py-3 font-medium text-foreground">{t.subject}</td>
                        <td className="px-4 py-3 text-foreground">{t.user_name ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[t.status] ?? ""}`}>{t.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{t.priority}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div>
          {selected ? (
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{selected.subject}</CardTitle>
                <p className="text-xs text-muted-foreground">{selected.description}</p>
              </CardHeader>
              <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                {selected.messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                ) : (
                  selected.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-lg text-sm ${m.sender_type === "admin" ? "bg-primary/10 ml-4" : "bg-muted mr-4"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground capitalize">{m.sender_type}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{new Date(m.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-foreground">{m.content}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Select a ticket to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
