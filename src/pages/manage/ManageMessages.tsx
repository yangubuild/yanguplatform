import { useState } from "react";
import {
  MessageSquare, Inbox, Send, AlertTriangle, Clock,
  CheckCircle2, ArrowUpRight, Users, ChevronRight, Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";

type TicketState = "urgent" | "unread" | "open" | "escalated" | "solved";
type Team = "Developers" | "Finance" | "Moderation" | "Customer Support";

interface Ticket {
  id: string;
  subject: string;
  user: string;
  state: TicketState;
  assignedTo: Team;
  time: string;
}

const stateConfig: Record<TicketState, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "bg-destructive/10 text-destructive border-destructive/20" },
  unread: { label: "Unread", color: "bg-accent/10 text-accent border-accent/20" },
  open: { label: "Open", color: "bg-warning/10 text-warning border-warning/20" },
  escalated: { label: "Escalated", color: "bg-destructive/10 text-destructive border-destructive/20" },
  solved: { label: "Solved", color: "bg-success/10 text-success border-success/20" },
};

const mockTickets: Ticket[] = [
  { id: "T-1001", subject: "Payment not processing", user: "Alice Mwangi", state: "urgent", assignedTo: "Finance", time: "3m ago" },
  { id: "T-1002", subject: "Surface not publishing", user: "Brian Ochieng", state: "unread", assignedTo: "Developers", time: "10m ago" },
  { id: "T-1003", subject: "Inappropriate content report", user: "Clara Njeri", state: "escalated", assignedTo: "Moderation", time: "22m ago" },
  { id: "T-1004", subject: "Cannot verify KYC documents", user: "David Kamau", state: "open", assignedTo: "Customer Support", time: "45m ago" },
  { id: "T-1005", subject: "Billing dispute", user: "Eve Wanjiku", state: "open", assignedTo: "Finance", time: "1h ago" },
  { id: "T-1006", subject: "Feature request: bulk export", user: "Frank Otieno", state: "solved", assignedTo: "Developers", time: "2h ago" },
];

const mockTeamMessages = [
  { from: "Admin 1", text: "Deployed the new publish flow — testing now.", time: "5m ago" },
  { from: "Admin 2", text: "KYC backlog cleared. 12 approvals done.", time: "18m ago" },
  { from: "Admin 3", text: "M-Pesa gateway latency is back to normal.", time: "32m ago" },
  { from: "Admin 1", text: "Blog moderation queue has 3 items remaining.", time: "1h ago" },
];

export default function ManageMessages() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TicketState | "all">("all");

  const filtered = mockTickets.filter((t) => {
    if (filter !== "all" && t.state !== filter) return false;
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) && !t.user.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-1.5">
            <Inbox className="h-4 w-4" /> Support Inbox
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5">
            <MessageSquare className="h-4 w-4" /> Team Chat
          </TabsTrigger>
        </TabsList>

        {/* ── Support Inbox ─────────────────── */}
        <TabsContent value="inbox" className="space-y-4 mt-4">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets…"
              className="max-w-xs h-9 text-sm"
            />
            <div className="flex gap-1.5 flex-wrap">
              {(["all", "urgent", "unread", "open", "escalated", "solved"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={filter === s ? "default" : "outline"}
                  className="text-xs h-7 capitalize"
                  onClick={() => setFilter(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-4">
            {([
              { label: "Urgent", count: mockTickets.filter((t) => t.state === "urgent").length, icon: AlertTriangle, status: "rejected" },
              { label: "Unread", count: mockTickets.filter((t) => t.state === "unread").length, icon: Inbox, status: "pending" },
              { label: "Open", count: mockTickets.filter((t) => t.state === "open").length, icon: Clock, status: "pending" },
              { label: "Solved", count: mockTickets.filter((t) => t.state === "solved").length, icon: CheckCircle2, status: "active" },
            ] as const).map((s) => (
              <Card key={s.label} className="p-3">
                <div className="flex items-center gap-3">
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-bold">{s.count}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Ticket list */}
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${stateConfig[t.state].color}`}>
                      {stateConfig[t.state].label}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.user} · {t.time} · <span className="text-accent">{t.assignedTo}</span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">No tickets match your filter.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Team Chat ─────────────────────── */}
        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Admin Team Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockTeamMessages.map((m, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{m.from}</span>
                    <span className="text-[10px] text-muted-foreground">{m.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{m.text}</p>
                </div>
              ))}
              {/* Input */}
              <div className="flex gap-2 pt-2">
                <Input placeholder="Type a message…" className="text-sm h-9" />
                <Button size="sm" variant="ghost" className="h-9 w-9 p-0 shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
