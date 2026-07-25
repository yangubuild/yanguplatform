import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle, PhoneCall, Mail, Instagram, Globe, Send, UserPlus,
  StickyNote, Calendar, TicketCheck, CheckCircle2, ShieldAlert, Archive,
  Bot, User, AlertTriangle, Sparkles,
} from "lucide-react";
import { db } from "../data/mock";
import { conversationDb } from "../data/conversationDb";
import {
  useConversations, useSendHumanMessage, useAddConversationNote,
  useTakeoverConversation, useReturnToAI, useSetConversationStatus,
} from "../data/hooks";
import type { Conversation, ConversationStatus, Message } from "../data/types";
import { PageHeader } from "../components/PageHeader";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const channelIcon: Record<string, any> = {
  whatsapp: MessageCircle, web: Globe, voice: PhoneCall,
  email: Mail, instagram: Instagram, sms: MessageCircle,
};

type StatusFilter = "all" | "new" | "active" | "waiting" | "escalated" | "human" | "resolved" | "spam" | "archived" | "unread";
type ChannelFilter = "all" | "web" | "whatsapp" | "email" | "voice";

export default function InboxPage() {
  const { data: convosRemote = [], isLoading, refetch } = useConversations();
  const [, setTick] = useState(0); // force re-render for conversationDb mutations
  const convos = convosRemote;
  const [activeId, setActiveId] = useState<string | undefined>();
  useEffect(() => {
    if (!activeId && convos.length > 0) setActiveId(convos[0]?.id);
  }, [activeId, convos]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const team = db.team.list();
  const sendHumanMut = useSendHumanMessage();
  const addNoteMut = useAddConversationNote();
  const takeoverMut = useTakeoverConversation();
  const returnAIMut = useReturnToAI();
  const statusMut = useSetConversationStatus();

  const filtered = useMemo(() => convos.filter((c) => {
    if (channelFilter !== "all" && c.channel !== channelFilter) return false;
    if (statusFilter === "all") return !c.archived && !c.spam;
    if (statusFilter === "unread") return c.unread > 0;
    if (statusFilter === "escalated") return c.status === "escalated" || c.status === "handover";
    return c.status === statusFilter;
  }), [convos, statusFilter, channelFilter]);
  const active = convos.find((c) => c.id === activeId);
  const agent = active ? db.agents.get(active.agentId) : undefined;

  const refresh = () => { setTick((n) => n + 1); void refetch(); };

  const send = () => {
    if (!active || !reply.trim()) return;
    if (active.status === "human") {
      conversationDb.sendHuman(active.id, reply.trim());
      sendHumanMut.mutate({ conversationId: active.id, text: reply.trim() });
    } else {
      // In the inbox, a typed reply from the operator posts as a customer-simulation only if we're in human mode.
      // Otherwise, simulate an inbound customer message so the AI answers (useful for demos).
      conversationDb.send(active.id, reply.trim());
    }
    setReply("");
    refresh();
  };
  const takeover = () => {
    if (!active) return;
    conversationDb.takeover(active.id);
    takeoverMut.mutate({ conversationId: active.id });
    refresh();
  };
  const returnAI = () => {
    if (!active) return;
    const c = conversationDb.returnToAI(active.id);
    returnAIMut.mutate({ conversationId: active.id, summary: c.handoverSummary ?? "Returned by operator" });
    refresh();
  };
  const doStatus = (s: ConversationStatus, label: string) => {
    if (!active) return;
    conversationDb.setStatus(active.id, s, { note: label });
    statusMut.mutate({ conversationId: active.id, status: s });
    refresh();
  };
  const createLead = () => { if (!active) return; conversationDb.createLead(active.id); refresh(); toast({ title: "Lead created" }); };
  const bookAppt = () => { if (!active) return; conversationDb.bookAppointment(active.id); refresh(); toast({ title: "Appointment booked" }); };
  const createTicket = () => { if (!active) return; conversationDb.createTicket(active.id); refresh(); toast({ title: "Support ticket created" }); };
  const resolve = () => { if (!active) return; conversationDb.resolve(active.id); statusMut.mutate({ conversationId: active.id, status: "resolved" }); refresh(); };
  const addNote = () => {
    if (!active || !note.trim()) return;
    conversationDb.addNote(active.id, note.trim());
    addNoteMut.mutate({ conversationId: active.id, text: note.trim() });
    setNote(""); refresh();
  };
  const assign = (member: string) => { if (!active) return; conversationDb.assignTo(active.id, member); refresh(); };

  const priorityBadge = (p?: Conversation["priority"]) =>
    p === "urgent" ? "bg-destructive text-destructive-foreground" :
    p === "high" ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" :
    "bg-muted text-muted-foreground";

  return (
    <div className="space-y-4">
      <PageHeader title="Inbox" description="Every channel, one thread — powered by the Conversation Engine." />
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
            {filtered.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">No conversations match.</div>}
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
                  {active.status !== "human" ? (
                    <Button size="sm" variant="outline" onClick={takeover}><User className="h-3.5 w-3.5 mr-1" />Take over</Button>
                  ) : (
                    <Button size="sm" onClick={returnAI}><Bot className="h-3.5 w-3.5 mr-1" />Return to AI</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={resolve}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Resolve</Button>
                  <Button size="sm" variant="outline" onClick={() => doStatus("spam", "Marked spam")}><ShieldAlert className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => doStatus("archived", "Archived")}><Archive className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-3 bg-muted/20">
                {active.messages.map((m) => <MessageBubble key={m.id} m={m} agentName={agent?.name} />)}
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  placeholder={active.status === "human" ? "Reply as human…" : "Simulate a customer message (AI will respond)…"}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />
                <Button onClick={send}><Send className="h-4 w-4" /></Button>
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
                <Stat label="Sentiment" value={active.sentiment ?? "neutral"} />
                <Stat label="Language" value={active.language ?? "English"} />
                <Stat label="Outcome" value={active.outcome ?? "open"} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Agent handling</p>
                <p className="text-sm">{agent?.name} · <span className="capitalize text-muted-foreground">{agent?.type}</span></p>
                {active.assignedTo && <p className="text-xs text-muted-foreground mt-1">Assigned to {active.assignedTo}</p>}
                {active.takeoverBy && <p className="text-xs text-muted-foreground">Taken over by {active.takeoverBy}</p>}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Assign to</p>
                <Select onValueChange={assign}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Choose teammate…" /></SelectTrigger>
                  <SelectContent>
                    {team.map((t) => <SelectItem key={t.id} value={t.name}>{t.name} · {t.role}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" onClick={createLead}><UserPlus className="h-4 w-4 mr-1.5" />Create lead</Button>
                <Button variant="outline" size="sm" className="w-full" onClick={bookAppt}><Calendar className="h-4 w-4 mr-1.5" />Book appointment</Button>
                <Button variant="outline" size="sm" className="w-full" onClick={createTicket}><TicketCheck className="h-4 w-4 mr-1.5" />Create ticket</Button>
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
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={addNote}><StickyNote className="h-4 w-4 mr-1.5" />Add note</Button>
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