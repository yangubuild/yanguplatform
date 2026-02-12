import { useState } from "react";
import {
  MessageSquare, Inbox, Send, AlertTriangle, Clock,
  CheckCircle2, Users, ChevronRight, ChevronLeft,
  ArrowUpRight, Tag, User, Mail, StickyNote, Flag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRoles } from "@/hooks/useRoles";

/* ── Types ───────────────────────────────────── */
type TicketStatus = "unread" | "open" | "escalated" | "solved";
type Priority = "urgent" | "normal";
type Category = "billing" | "technical" | "kyc" | "content" | "domains" | "general";
type Department = "unassigned" | "developers" | "finance" | "support" | "moderation";

interface TicketMessage {
  id: string;
  from: string;
  isAdmin: boolean;
  text: string;
  time: string;
}

interface InternalNote {
  id: string;
  author: string;
  text: string;
  time: string;
}

interface Ticket {
  id: string;
  subject: string;
  userName: string;
  userEmail: string;
  status: TicketStatus;
  priority: Priority;
  category: Category;
  assignedTo: Department;
  lastUpdate: string;
  messages: TicketMessage[];
  notes: InternalNote[];
}

/* ── Config ──────────────────────────────────── */
const statusConfig: Record<TicketStatus, { label: string; color: string }> = {
  unread: { label: "Unread", color: "bg-accent/10 text-accent border-accent/20" },
  open: { label: "Open", color: "bg-warning/10 text-warning border-warning/20" },
  escalated: { label: "Escalated", color: "bg-destructive/10 text-destructive border-destructive/20" },
  solved: { label: "Solved", color: "bg-success/10 text-success border-success/20" },
};

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "bg-destructive/10 text-destructive border-destructive/20" },
  normal: { label: "Normal", color: "bg-muted text-muted-foreground border-border" },
};

const categoryLabels: Record<Category, string> = {
  billing: "Billing/Payments",
  technical: "Technical Bug",
  kyc: "KYC/Identity",
  content: "Content/Moderation",
  domains: "Domains/Routing",
  general: "General",
};

const departmentLabels: Record<Department, string> = {
  unassigned: "Unassigned",
  developers: "Developers",
  finance: "Finance",
  support: "Customer Support",
  moderation: "Moderation",
};

const statusFilters: (TicketStatus | "all")[] = ["all", "unread", "open", "escalated", "solved"];
const categories: Category[] = ["billing", "technical", "kyc", "content", "domains", "general"];

/* ── Mock Data ───────────────────────────────── */
const mockTickets: Ticket[] = [
  {
    id: "T-1001", subject: "Payment not processing", userName: "Alice Mwangi", userEmail: "alice@example.com",
    status: "unread", priority: "urgent", category: "billing", assignedTo: "finance", lastUpdate: "3m ago",
    messages: [
      { id: "m1", from: "Alice Mwangi", isAdmin: false, text: "I've been trying to complete my payment for the last hour but it keeps failing with a generic error. My M-Pesa balance is sufficient.", time: "3m ago" },
      { id: "m2", from: "Support Agent", isAdmin: true, text: "Hi Alice, let me check the payment gateway logs for your account. Can you share the transaction reference?", time: "1m ago" },
    ],
    notes: [{ id: "n1", author: "Admin 1", text: "M-Pesa gateway was experiencing intermittent issues. Monitoring.", time: "2m ago" }],
  },
  {
    id: "T-1002", subject: "Surface not publishing", userName: "Brian Ochieng", userEmail: "brian@example.com",
    status: "open", priority: "normal", category: "technical", assignedTo: "developers", lastUpdate: "10m ago",
    messages: [
      { id: "m3", from: "Brian Ochieng", isAdmin: false, text: "My surface shows 'ready' but the publish button does nothing. No error message.", time: "10m ago" },
    ],
    notes: [],
  },
  {
    id: "T-1003", subject: "Inappropriate content report", userName: "Clara Njeri", userEmail: "clara@example.com",
    status: "escalated", priority: "urgent", category: "content", assignedTo: "moderation", lastUpdate: "22m ago",
    messages: [
      { id: "m4", from: "Clara Njeri", isAdmin: false, text: "There is offensive content on a community surface that needs immediate removal.", time: "22m ago" },
    ],
    notes: [{ id: "n2", author: "Moderator", text: "Content reviewed — violates TOS section 4.2. Escalated for removal.", time: "15m ago" }],
  },
  {
    id: "T-1004", subject: "Cannot verify KYC documents", userName: "David Kamau", userEmail: "david@example.com",
    status: "open", priority: "normal", category: "kyc", assignedTo: "support", lastUpdate: "45m ago",
    messages: [
      { id: "m5", from: "David Kamau", isAdmin: false, text: "I uploaded my ID but the verification keeps saying 'document unclear'. The image is high quality.", time: "45m ago" },
    ],
    notes: [],
  },
  {
    id: "T-1005", subject: "Billing dispute — double charge", userName: "Eve Wanjiku", userEmail: "eve@example.com",
    status: "open", priority: "urgent", category: "billing", assignedTo: "finance", lastUpdate: "1h ago",
    messages: [
      { id: "m6", from: "Eve Wanjiku", isAdmin: false, text: "I was charged twice for my subscription this month. Please refund the duplicate.", time: "1h ago" },
    ],
    notes: [],
  },
  {
    id: "T-1006", subject: "Custom domain not resolving", userName: "Frank Otieno", userEmail: "frank@example.com",
    status: "solved", priority: "normal", category: "domains", assignedTo: "developers", lastUpdate: "2h ago",
    messages: [
      { id: "m7", from: "Frank Otieno", isAdmin: false, text: "My custom domain was pointing to the wrong surface. Fixed now.", time: "3h ago" },
      { id: "m8", from: "Support Agent", isAdmin: true, text: "Glad it's resolved! The DNS propagation delay was the cause. Closing this ticket.", time: "2h ago" },
    ],
    notes: [],
  },
  {
    id: "T-1007", subject: "Feature request: bulk export", userName: "Grace Akinyi", userEmail: "grace@example.com",
    status: "unread", priority: "normal", category: "general", assignedTo: "unassigned", lastUpdate: "4h ago",
    messages: [
      { id: "m9", from: "Grace Akinyi", isAdmin: false, text: "Would love the ability to export all my content in bulk. Is this on the roadmap?", time: "4h ago" },
    ],
    notes: [],
  },
];

const mockTeamMessages = [
  { from: "Admin 1", text: "Deployed the new publish flow — testing now.", time: "5m ago" },
  { from: "Admin 2", text: "KYC backlog cleared. 12 approvals done.", time: "18m ago" },
  { from: "Admin 3", text: "M-Pesa gateway latency is back to normal.", time: "32m ago" },
  { from: "Admin 1", text: "Blog moderation queue has 3 items remaining.", time: "1h ago" },
];

/* ── Stat Cards ──────────────────────────────── */
function StatCards({ tickets }: { tickets: Ticket[] }) {
  const stats = [
    { label: "Urgent", count: tickets.filter((t) => t.priority === "urgent" && t.status !== "solved").length, icon: AlertTriangle, color: "text-destructive" },
    { label: "Unread", count: tickets.filter((t) => t.status === "unread").length, icon: Inbox, color: "text-accent" },
    { label: "Open", count: tickets.filter((t) => t.status === "open").length, icon: Clock, color: "text-warning" },
    { label: "Escalated", count: tickets.filter((t) => t.status === "escalated").length, icon: ArrowUpRight, color: "text-destructive" },
    { label: "Solved", count: tickets.filter((t) => t.status === "solved").length, icon: CheckCircle2, color: "text-success" },
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

/* ── Ticket Detail View ──────────────────────── */
function TicketDetail({
  ticket,
  onBack,
  isAdmin,
}: {
  ticket: Ticket;
  onBack: () => void;
  isAdmin: boolean;
}) {
  const [replyText, setReplyText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [priority, setPriority] = useState<Priority>(ticket.priority);
  const [assignedTo, setAssignedTo] = useState<Department>(ticket.assignedTo);

  const handleEscalate = () => {
    setStatus("escalated");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
            <Badge variant="outline" className={`text-[10px] ${statusConfig[status].color}`}>
              {statusConfig[status].label}
            </Badge>
            <Badge variant="outline" className={`text-[10px] ${priorityConfig[priority].color}`}>
              {priorityConfig[priority].label}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {categoryLabels[ticket.category]}
            </Badge>
          </div>
          <h2 className="text-lg font-semibold mt-1">{ticket.subject}</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <User className="h-3 w-3" /> {ticket.userName}
            <span className="mx-1">·</span>
            <Mail className="h-3 w-3" /> {ticket.userEmail}
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* A) Conversation thread */}
        <div className="lg:col-span-2 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg border p-3 ${msg.isAdmin ? "bg-accent/5 border-accent/20 ml-6" : "bg-muted/30 border-border mr-6"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      {msg.isAdmin && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Staff</Badge>}
                      {msg.from}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{msg.text}</p>
                </div>
              ))}

              {/* Reply box */}
              <div className="pt-2 space-y-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply…"
                  className="text-sm min-h-[80px]"
                />
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Mark as {status === "unread" ? "read" : "unread"}
                  </Button>
                  <Button size="sm" className="gap-1.5">
                    <Send className="h-3.5 w-3.5" /> Send Reply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Internal notes */}
          {isAdmin && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <StickyNote className="h-4 w-4 text-warning" /> Internal Notes
                  <Badge variant="outline" className="text-[9px] ml-1">Admin only</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.notes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{note.author}</span>
                      <span className="text-[10px] text-muted-foreground">{note.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{note.text}</p>
                  </div>
                ))}
                {ticket.notes.length === 0 && (
                  <p className="text-xs text-muted-foreground">No internal notes yet.</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add internal note…"
                    className="text-sm h-9"
                  />
                  <Button size="sm" variant="outline" className="h-9 shrink-0">Add</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* B) Ticket controls panel */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ticket Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(statusConfig) as TicketStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assign to */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Assign to</label>
                <Select value={assignedTo} onValueChange={(v) => setAssignedTo(v as Department)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(departmentLabels) as Department[]).map((d) => (
                      <SelectItem key={d} value={d}>{departmentLabels[d]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Badge variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" /> {categoryLabels[ticket.category]}
                </Badge>
              </div>

              <div className="border-t border-border pt-3 space-y-2">
                {/* Escalate */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={handleEscalate}
                  disabled={status === "escalated"}
                >
                  <Flag className="h-3.5 w-3.5" />
                  {status === "escalated" ? "Already Escalated" : "Escalate"}
                </Button>

                {/* Create task placeholder */}
                <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                  Create Task (coming soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────── */
export default function ManageMessages() {
  const { isAdmin, isContentEditor } = useRoles();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Read initial filter from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const initialFilter = urlParams.get("filter");
  if (initialFilter && statusFilter === "all" && statusFilters.includes(initialFilter as any)) {
    // Only set once
  }

  // Content editors can only see content/moderation tickets
  const visibleTickets = isContentEditor && !isAdmin
    ? mockTickets.filter((t) => t.category === "content")
    : mockTickets;

  const filtered = visibleTickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.subject.toLowerCase().includes(q) && !t.userName.toLowerCase().includes(q) && !t.userEmail.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Show Team Chat tab only for admins (not content editors)
  const showTeamChat = isAdmin;

  if (selectedTicket) {
    return <TicketDetail ticket={selectedTicket} onBack={() => setSelectedTicket(null)} isAdmin={isAdmin} />;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-1.5">
            <Inbox className="h-4 w-4" /> Support Inbox
          </TabsTrigger>
          {showTeamChat && (
            <TabsTrigger value="team" className="gap-1.5">
              <MessageSquare className="h-4 w-4" /> Team Chat
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Support Inbox ─────────────────── */}
        <TabsContent value="inbox" className="space-y-4 mt-4">
          {/* Stat cards */}
          <StatCards tickets={visibleTickets} />

          {/* Toolbar */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 items-center">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets…"
                className="max-w-xs h-9 text-sm"
              />
              <div className="flex gap-1.5 flex-wrap">
                {statusFilters.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={statusFilter === s ? "default" : "outline"}
                    className="text-xs h-7 capitalize"
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === "all" ? "All" : statusConfig[s].label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Category chips */}
            <div className="flex gap-1.5 flex-wrap">
              <Button
                size="sm"
                variant={categoryFilter === "all" ? "secondary" : "ghost"}
                className="text-xs h-6 px-2"
                onClick={() => setCategoryFilter("all")}
              >
                All Categories
              </Button>
              {categories.map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={categoryFilter === c ? "secondary" : "ghost"}
                  className="text-xs h-6 px-2"
                  onClick={() => setCategoryFilter(c)}
                >
                  {categoryLabels[c]}
                </Button>
              ))}
            </div>
          </div>

          {/* Ticket list */}
          <Card>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[100px_80px_120px_1fr_140px_100px_120px] gap-2 px-4 py-2 border-b border-border text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              <span>Status</span>
              <span>Priority</span>
              <span>Category</span>
              <span>Subject / User</span>
              <span>Assigned To</span>
              <span>Updated</span>
              <span></span>
            </div>
            <CardContent className="p-0 divide-y divide-border">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedTicket(t)}
                >
                  <div className="hidden md:grid grid-cols-[100px_80px_120px_1fr_140px_100px] gap-2 items-center w-full">
                    <Badge variant="outline" className={`text-[10px] w-fit ${statusConfig[t.status].color}`}>
                      {statusConfig[t.status].label}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] w-fit ${priorityConfig[t.priority].color}`}>
                      {priorityConfig[t.priority].label}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground truncate">{categoryLabels[t.category]}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.subject}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{t.userName} · {t.userEmail}</p>
                    </div>
                    <span className="text-xs text-accent">{departmentLabels[t.assignedTo]}</span>
                    <span className="text-[11px] text-muted-foreground">{t.lastUpdate}</span>
                  </div>
                  {/* Mobile view */}
                  <div className="md:hidden flex items-center gap-3 min-w-0 w-full">
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${statusConfig[t.status].color}`}>
                      {statusConfig[t.status].label}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.userName} · {t.lastUpdate} · <span className="text-accent">{departmentLabels[t.assignedTo]}</span>
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
        {showTeamChat && (
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
                <div className="flex gap-2 pt-2">
                  <Input placeholder="Type a message…" className="text-sm h-9" />
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
