import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle, PhoneCall, Mail, Instagram, Globe, Send, UserPlus,
  StickyNote, Calendar, CheckCircle2, ShieldAlert, Archive,
  Bot, User, AlertTriangle, Sparkles,
} from "lucide-react";
import {
  useConversations, useConversation, useAgents, useSendHumanMessage, useAddConversationNote,
  useTakeoverConversation, useReturnToAI, useSetConversationStatus,
  useCreateLead, useCreateAppointment,
} from "../data/hooks";
import type { Conversation, ConversationStatus, Message } from "../data/types";
import { PageHeader } from "../components/PageHeader";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { YanguSpinner } from "../components/YanguSpinner";

const channelIcon: Record<string, any> = {
  whatsapp: MessageCircle, web: Globe, voice: PhoneCall,
  email: Mail, instagram: Instagram, sms: MessageCircle,
};

type StatusFilter = "all" | "new" | "active" | "waiting" | "escalated" | "human" | "resolved" | "spam" | "archived" | "unread";
type ChannelFilter = "all" | "web" | "whatsapp" | "email" | "voice";

export default function InboxPage() {
  const { data: convos = [], isLoading } = useConversations();
  const [activeId, setActiveId] = useState<string | undefined>();
  useEffect(() => {
    if (!activeId && convos.length > 0) setActiveId(convos[0]?.id);
  }, [activeId, convos]);
  const { data: activeDetail } = useConversation(activeId);
  const { data: agents = [] } = useAgents();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [apptOpen, setApptOpen] = useState(false);
  const [apptTitle, setApptTitle] = useState("");
  const [apptWhen, setApptWhen] = useState("");
  const [apptDuration, setApptDuration] = useState(30);

  const sendHumanMut = useSendHumanMessage();
  const addNoteMut = useAddConversationNote();
  const takeoverMut = useTakeoverConversation();
  const returnAIMut = useReturnToAI();
  const statusMut = useSetConversationStatus();
  const createLeadMut = useCreateLead();
  const createApptMut = useCreateAppointment();

  const filtered = useMemo(() => convos.filter((c) => {
    if (channelFilter !== "all" && c.channel !== channelFilter) return false;
    if (statusFilter === "all") return !c.archived && !c.spam;
    if (statusFilter === "unread") return c.unread > 0;
    if (statusFilter === "escalated") return c.status === "escalated" || c.status === "handover";
    return c.status === statusFilter;
  }), [convos, statusFilter, channelFilter]);

  const listItem = convos.find((c) => c.id === activeId);
  const active = activeDetail ?? listItem;
  const agent = active ? agents.find((a) => a.id === active.agentId) : undefined;
  const isHumanMode = active?.status === "human";

  const send = () => {
    if (!active || !reply.trim() || !isHumanMode) return;
    sendHumanMut.mutate({ conversationId: active.id, text: reply.trim() });
    setReply("");
  };
  const takeover = () => { if (active) takeoverMut.mutate({ conversationId: active.id }); };
  const returnAI = () => {
    if (!active) return;
    returnAIMut.mutate({ conversationId: active.id, summary: "Returned to AI by operator" });
  };
  const doStatus = (s: ConversationStatus) => {
    if (active) statusMut.mutate({ conversationId: active.id, status: s });
  };
  const createLead = () => {
    if (!active) return;
    const handle = active.contactHandle ?? "";
    createLeadMut.mutate({
      name: active.contactName,
      email: handle.includes("@") ? handle : undefined,
      phone: handle.startsWith("+") ? handle : undefined,
      source: active.channel,
      intent: (active.lastMessage ?? "").slice(0, 200) || "Captured from inbox",
      score: 50,
      stage: "new",
      owner: "",
    });
  };
  const openAppt = () => {
    if (!active) return;
    setApptTitle(`Appointment — ${active.contactName}`);
    setApptWhen("");
    setApptDuration(30);
    setApptOpen(true);
  };
  const bookAppt = () => {
    if (!active || !apptWhen) return;
    createApptMut.mutate({
      title: apptTitle.trim() || `Appointment — ${active.contactName}`,
      contact: active.contactName,
      channel: active.channel,
      when: new Date(apptWhen).toISOString(),
      duration: apptDuration,
      agentId: active.agentId,
      status: "scheduled",
    }, { onSuccess: () => setApptOpen(false) });
  };
  const addNote = () => {
    if (!active || !note.trim()) return;
    addNoteMut.mutate({ conversationId: active.id, text: note.trim() }, { onSuccess: () => setNote("") });
  };

  const priorityBadge = (p?: Conversation["priority"]) =>
    p === "urgent" ? "bg-destructive text-destructive-foreground" :
    p === "high" ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" :
    "bg-muted text-muted-foreground";

  return (
    <div className="space-y-4">
      <PageHeader title="Inbox" description="Live conversations from every connected channel." />
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-4 h-[calc(100vh-260px)] min-h-[560px]">
        {/* List */}
        <Card className="overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border space-y-2">
            <Tabs value={channelFilter} onValueChange={(v) => setChannelFilter(v as ChannelFilter)}>
              <TabsList className="w-full grid grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="web">Web</TabsTrigger>
                <TabsTrigger value="whatsapp">WA</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="voice">Voice</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All conversations</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="human">Human-controlled</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 overflow-auto">
            {isLoading && (
              <div className="p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <YanguSpinner size={16} />Loading conversations…
              </div>
            )}
            {filtered.map((c) => {
              const Icon = channelIcon[c.channel] ?? MessageCircle;
              return (
                <button key={c.id} onClick={() => setActiveId(c.id)} className={cn(
                  "w-full text-left p-3 border-b border-border hover:bg-muted/50 transition",
                  activeId === c.id && "bg-muted"
                )}>
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-xs font-medium">{c.contactName.split(" ").map(x=>x[0]).join("").slice(0,2)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">{c.contactName}</p>
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {(c.status === "escalated" || c.status === "handover") && <Badge variant="destructive" className="text-[10px] h-4">Escalated</Badge>}
                        {c.status === "human" && <Badge className="text-[10px] h-4 bg-primary">Human</Badge>}
                        {c.status === "resolved" && <Badge variant="outline" className="text-[10px] h-4">Resolved</Badge>}
                        {c.priority && c.priority !== "normal" && (
                          <span className={cn("text-[10px] h-4 px-1.5 rounded-lg leading-4", priorityBadge(c.priority))}>{c.priority}</span>
                        )}
                        {c.language && c.language !== "English" && <Badge variant="outline" className="text-[10px] h-4">{c.language}</Badge>}
                        {c.unread > 0 && <Badge className="text-[10px] h-4">{c.unread}</Badge>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <div className="p-6 text-sm text-muted-foreground text-center">
                {convos.length === 0 ? "No conversations yet. They appear here as soon as a channel starts receiving messages." : "No conversations match these filters."}
              </div>
            )}
          </div>
        </Card>

        {/* Thread */}
        <Card className="overflow-hidden flex flex-col">
          {active ? (
            <>
              <div className="p-3 border-b border-border flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-medium text-sm">{active.contactName}</p>
                  <p className="text-xs text-muted-foreground">{active.contactHandle} · {active.channel} · <span className="capitalize">{active.status}</span></p>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {!isHumanMode ? (
                    <Button size="sm" variant="outline" onClick={takeover} disabled={takeoverMut.isPending}><User className="h-3.5 w-3.5 mr-1" />Take over</Button>
                  ) : (
                    <Button size="sm" onClick={returnAI} disabled={returnAIMut.isPending}><Bot className="h-3.5 w-3.5 mr-1" />Return to AI</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => doStatus("resolved")}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Resolve</Button>
                  <Button size="sm" variant="outline" title="Mark as spam" onClick={() => doStatus("spam")}><ShieldAlert className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" title="Archive" onClick={() => doStatus("archived")}><Archive className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-3 bg-muted/20">
                {(active.messages ?? []).map((m) => <MessageBubble key={m.id} m={m} agentName={agent?.name} />)}
                {(active.messages ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">No messages in this conversation yet.</p>
                )}
              </div>
              <div className="p-3 border-t border-border space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder={isHumanMode ? "Reply as human…" : "Take over the conversation to reply"}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    disabled={!isHumanMode || sendHumanMut.isPending}
                  />
                  <Button onClick={send} disabled={!isHumanMode || !reply.trim() || sendHumanMut.isPending}><Send className="h-4 w-4" /></Button>
                </div>
                {!isHumanMode && (
                  <p className="text-xs text-muted-foreground">The AI is handling this conversation. Take over to reply as a human.</p>
                )}
              </div>
            </>
          ) : <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Select a conversation</div>}
        </Card>

        {/* Context */}
        <Card className="overflow-auto">
          {active && (
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Contact</p>
                <p className="font-semibold">{active.contactName}</p>
                <p className="text-sm text-muted-foreground">{active.contactHandle}</p>
                <p className="text-xs text-muted-foreground mt-1">Source: {active.channel}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Stat label="Priority" value={active.priority ?? "normal"} />
                <Stat label="Sentiment" value={active.sentiment ?? "unknown"} />
                <Stat label="Language" value={active.language ?? "unknown"} />
                <Stat label="Outcome" value={active.outcome ?? "open"} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Agent handling</p>
                <p className="text-sm">{agent?.name ?? "Unassigned"}{agent ? <> · <span className="capitalize text-muted-foreground">{agent.type}</span></> : null}</p>
                {active.takeoverBy && <p className="text-xs text-muted-foreground">Currently handled by a human operator.</p>}
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" onClick={createLead} disabled={createLeadMut.isPending}>
                  <UserPlus className="h-4 w-4 mr-1.5" />Create lead
                </Button>
                <Button variant="outline" size="sm" className="w-full" onClick={openAppt}>
                  <Calendar className="h-4 w-4 mr-1.5" />Book appointment
                </Button>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Internal notes</p>
                <div className="space-y-1 mb-2 max-h-32 overflow-auto">
                  {(active.notes ?? []).map((n) => (
                    <div key={n.id} className="text-xs bg-muted/50 rounded-lg p-2">
                      <p className="text-muted-foreground">{n.author} · {new Date(n.at).toLocaleTimeString()}</p>
                      <p>{n.text}</p>
                    </div>
                  ))}
                  {(!active.notes || active.notes.length === 0) && <p className="text-xs text-muted-foreground">No notes yet.</p>}
                </div>
                <Textarea rows={2} placeholder="Add an internal note…" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={addNote} disabled={!note.trim() || addNoteMut.isPending}>
                  <StickyNote className="h-4 w-4 mr-1.5" />Add note
                </Button>
              </div>
              {active.handoverSummary && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Last handover summary</p>
                  <p className="text-xs bg-muted/50 rounded-lg p-2">{active.handoverSummary}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <Dialog open={apptOpen} onOpenChange={setApptOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Book appointment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={apptTitle} onChange={(e) => setApptTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date and time</Label>
              <Input type="datetime-local" value={apptWhen} onChange={(e) => setApptWhen(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (minutes)</Label>
              <Input type="number" min={5} max={480} value={apptDuration} onChange={(e) => setApptDuration(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApptOpen(false)}>Cancel</Button>
            <Button onClick={bookAppt} disabled={!apptWhen || createApptMut.isPending}>
              {createApptMut.isPending ? "Booking…" : "Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs font-medium capitalize">{value}</p>
    </div>
  );
}

function MessageBubble({ m, agentName }: { m: Message; agentName?: string }) {
  if (m.role === "system") {
    return (
      <div className="flex justify-center">
        <span className="text-[11px] text-muted-foreground bg-background border border-border rounded-full px-3 py-1 flex items-center gap-1">
          {m.meta?.systemKind === "handover" && <AlertTriangle className="h-3 w-3" />}
          {m.meta?.systemKind === "command" && <Sparkles className="h-3 w-3" />}
          {m.text}
        </span>
      </div>
    );
  }
  const isCustomer = m.role === "customer";
  const isHuman = m.role === "human";
  return (
    <div className={cn("flex", isCustomer ? "justify-start" : "justify-end")}>
      <div className={cn(
        "max-w-[75%] rounded-lg px-3 py-2 text-sm",
        isCustomer ? "bg-background border border-border" :
        isHuman ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
      )}>
        {!isCustomer && (
          <div className="text-[10px] uppercase opacity-70 mb-0.5 flex items-center gap-1">
            {isHuman ? <User className="h-2.5 w-2.5" /> : <Bot className="h-2.5 w-2.5" />}
            {isHuman ? "You" : agentName ?? "Agent"}
            {m.meta?.confidence !== undefined && <span className="ml-1">· {Math.round(m.meta.confidence * 100)}%</span>}
            {m.meta?.language && m.meta.language !== "English" && <span>· {m.meta.language}</span>}
          </div>
        )}
        <div>{m.text}</div>
        {m.meta?.sources && m.meta.sources.length > 0 && (
          <div className="mt-1 pt-1 border-t border-current/10 text-[10px] opacity-80">
            Sources: {m.meta.sources.slice(0, 3).map((s) => s.name).join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}
