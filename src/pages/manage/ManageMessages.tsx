import { useState } from "react";
import {
  MessageSquare, Inbox, Send, AlertTriangle, Clock,
  CheckCircle2, ChevronLeft, User, StickyNote, Flag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useManageSupportTickets,
  useSupportReply,
  useSupportUpdateStatus,
  type SupportTicket,
} from "@/hooks/manage/useManageSupportTickets";

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-warning/10 text-warning border-warning/20" },
  pending: { label: "Pending", color: "bg-accent/10 text-accent border-accent/20" },
  replied: { label: "Replied", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  escalated: { label: "Escalated", color: "bg-destructive/10 text-destructive border-destructive/20" },
  resolved: { label: "Resolved", color: "bg-success/10 text-success border-success/20" },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground border-border" },
};

function StatCards({ tickets }: { tickets: SupportTicket[] }) {
  const stats = [
    { label: "Total", count: tickets.length, icon: MessageSquare, color: "text-foreground" },
    { label: "Open", count: tickets.filter((t) => t.status === "open" || t.status === "pending").length, icon: Inbox, color: "text-accent" },
    { label: "Escalated", count: tickets.filter((t) => t.status === "escalated").length, icon: AlertTriangle, color: "text-destructive" },
    { label: "Resolved", count: tickets.filter((t) => t.status === "resolved" || t.status === "closed").length, icon: CheckCircle2, color: "text-success" },
    { label: "SLA Breach", count: tickets.filter((t) => t.hours_since_created > 24 && t.status !== "resolved" && t.status !== "closed").length, icon: Clock, color: "text-destructive" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-5">
      {stats.map((s) => (
        <Card key={s.label} className="p-3">
          <div className="flex items-center gap-3">
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.count}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function TicketDetail({ ticket, onBack }: { ticket: SupportTicket; onBack: () => void }) {
  const [replyText, setReplyText] = useState("");
  const replyMut = useSupportReply();
  const statusMut = useSupportUpdateStatus();

  const handleReply = () => {
    if (!replyText.trim()) return;
    replyMut.mutate({ ticketId: ticket.id, content: replyText }, {
      onSuccess: () => setReplyText(""),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-[10px] ${statusConfig[ticket.status]?.color ?? ""}`}>
              {statusConfig[ticket.status]?.label ?? ticket.status}
            </Badge>
            {ticket.priority && (
              <Badge variant="outline" className={`text-[10px] ${ticket.priority === "urgent" ? "bg-destructive/10 text-destructive border-destructive/20" : ""}`}>
                {ticket.priority}
              </Badge>
            )}
            {ticket.category && (
              <Badge variant="outline" className="text-[10px]">{ticket.category}</Badge>
            )}
            {ticket.hours_since_created > 24 && ticket.status !== "resolved" && ticket.status !== "closed" && (
              <Badge variant="destructive" className="text-[10px]">SLA Breached</Badge>
            )}
          </div>
          <h2 className="text-lg font-semibold mt-1">{ticket.subject}</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <User className="h-3 w-3" /> {ticket.display_name ?? ticket.username ?? "Unknown"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.description && (
                <div className="rounded-lg border bg-muted/30 border-border p-3 mr-6">
                  <p className="text-xs font-semibold mb-1">{ticket.display_name ?? ticket.username ?? "User"}</p>
                  <p className="text-sm text-muted-foreground">{ticket.description}</p>
                </div>
              )}
              {ticket.messages.map((msg) => (
                <div key={msg.id} className={`rounded-lg border p-3 ${msg.sender_type === "admin" ? "bg-accent/5 border-accent/20 ml-6" : "bg-muted/30 border-border mr-6"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      {msg.sender_type === "admin" && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Staff</Badge>}
                      {msg.sender_type === "admin" ? "Admin" : (ticket.display_name ?? ticket.username ?? "User")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{msg.content}</p>
                </div>
              ))}
              {ticket.messages.length === 0 && !ticket.description && (
                <p className="text-xs text-muted-foreground">No messages yet.</p>
              )}
              <div className="pt-2 space-y-2">
                <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply…" className="text-sm min-h-[80px]" />
                <div className="flex justify-end">
                  <Button size="sm" className="gap-1.5" onClick={handleReply} disabled={replyMut.isPending || !replyText.trim()}>
                    <Send className="h-3.5 w-3.5" /> Send Reply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Ticket Controls</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={ticket.status} onValueChange={(v) => statusMut.mutate({ ticketId: ticket.id, status: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <Button variant="destructive" size="sm" className="w-full gap-1.5"
                  onClick={() => statusMut.mutate({ ticketId: ticket.id, status: "escalated" })}
                  disabled={ticket.status === "escalated" || statusMut.isPending}>
                  <Flag className="h-3.5 w-3.5" /> {ticket.status === "escalated" ? "Already Escalated" : "Escalate"}
                </Button>
                <Button variant="outline" size="sm" className="w-full gap-1.5"
                  onClick={() => statusMut.mutate({ ticketId: ticket.id, status: "resolved" })}
                  disabled={ticket.status === "resolved" || statusMut.isPending}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ManageMessages() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const { data: tickets = [], isLoading } = useManageSupportTickets();

  if (selectedTicket) {
    const live = tickets.find((t) => t.id === selectedTicket.id) ?? selectedTicket;
    return <TicketDetail ticket={live} onBack={() => setSelectedTicket(null)} />;
  }

  const filtered = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.subject.toLowerCase().includes(q) || (t.username ?? "").toLowerCase().includes(q) || (t.display_name ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <StatCards tickets={tickets} />

      <div className="flex items-center gap-3 flex-wrap">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets…"
          className="max-w-sm" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground p-4">Loading tickets…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No support tickets found</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <Card key={t.id} className="p-3 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedTicket(t)}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{t.subject}</span>
                    <Badge variant="outline" className={`text-[10px] ${statusConfig[t.status]?.color ?? ""}`}>
                      {statusConfig[t.status]?.label ?? t.status}
                    </Badge>
                    {t.hours_since_created > 24 && t.status !== "resolved" && t.status !== "closed" && (
                      <Badge variant="destructive" className="text-[10px]">SLA</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.display_name ?? t.username ?? "Unknown"} · {t.category ?? "general"} · {new Date(t.updated_at).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{t.messages.length} msg</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
