import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, PhoneCall, Mail, Instagram, Globe, Send, UserPlus, StickyNote } from "lucide-react";
import { db } from "../data/mock";
import type { Conversation } from "../data/types";
import { PageHeader } from "../components/PageHeader";
import { cn } from "@/lib/utils";

const channelIcon: Record<string, any> = {
  whatsapp: MessageCircle, web: Globe, voice: PhoneCall,
  email: Mail, instagram: Instagram, sms: MessageCircle,
};

export default function InboxPage() {
  const [convos, setConvos] = useState<Conversation[]>(() => db.conversations.list().map((c) => ({ ...c })));
  const [activeId, setActiveId] = useState(convos[0]?.id);
  const [filter, setFilter] = useState<"all" | "unread" | "handover" | "closed">("all");
  const [reply, setReply] = useState("");

  const filtered = convos.filter((c) => {
    if (filter === "all") return true;
    if (filter === "unread") return c.unread > 0;
    if (filter === "handover") return c.status === "handover";
    return c.status === "closed";
  });
  const active = convos.find((c) => c.id === activeId);
  const agent = active ? db.agents.get(active.agentId) : undefined;

  const setStatus = (next: Conversation["status"], sysText: string) => {
    if (!active) return;
    setConvos((prev) => prev.map((c) => c.id === active.id ? {
      ...c, status: next,
      messages: [...c.messages, { id: `sys-${Date.now()}`, role: "system", text: sysText, at: new Date().toISOString() }],
    } : c));
  };
  const send = () => {
    if (!active || !reply.trim()) return;
    const role = active.status === "handover" ? "human" : "agent";
    setConvos((prev) => prev.map((c) => c.id === active.id ? {
      ...c, lastMessage: reply,
      messages: [...c.messages, { id: `m-${Date.now()}`, role, text: reply, at: new Date().toISOString() }],
    } : c));
    setReply("");
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Inbox" description="Every channel, one thread." />
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-4 h-[calc(100vh-260px)] min-h-[560px]">
        {/* List */}
        <Card className="overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="w-full grid grid-cols-4"><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="unread">Unread</TabsTrigger><TabsTrigger value="handover">Handover</TabsTrigger><TabsTrigger value="closed">Closed</TabsTrigger></TabsList>
            </Tabs>
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
                      <div className="flex items-center gap-2 mt-1">
                        {c.status === "handover" && <Badge variant="destructive" className="text-[10px] h-4">Handover</Badge>}
                        {c.unread > 0 && <Badge className="text-[10px] h-4">{c.unread}</Badge>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Thread */}
        <Card className="overflow-hidden flex flex-col">
          {active ? (
            <>
              <div className="p-3 border-b border-border flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{active.contactName}</p>
                  <p className="text-xs text-muted-foreground">{active.contactHandle} · {active.channel}</p>
                </div>
                {active.status === "open" && <Button size="sm" variant="outline" onClick={() => setStatus("handover", "Human took over — you are now replying")}>Take over</Button>}
                {active.status === "handover" && <Button size="sm" onClick={() => setStatus("open", `Returned to ${agent?.name ?? "agent"}`)}>Return to agent</Button>}
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-3 bg-muted/20">
                {active.messages.map((m) => (
                  <div key={m.id} className={cn(
                    "flex", m.role === "customer" ? "justify-start" : m.role === "system" ? "justify-center" : "justify-end"
                  )}>
                    {m.role === "system" ? (
                      <span className="text-xs text-muted-foreground bg-background border border-border rounded-full px-3 py-1">{m.text}</span>
                    ) : (
                      <div className={cn(
                        "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                        m.role === "customer" ? "bg-background border border-border" :
                        m.role === "human" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                      )}>
                        {m.role !== "customer" && <div className="text-[10px] uppercase opacity-70 mb-0.5">{m.role === "human" ? "You" : agent?.name}</div>}
                        {m.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Input placeholder={active.status === "handover" ? "Reply as human…" : "Reply as agent…"} value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
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
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Agent handling</p>
                <p className="text-sm">{agent?.name} · <span className="capitalize text-muted-foreground">{agent?.type}</span></p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-1"><Badge variant="secondary">VIP</Badge><Badge variant="secondary">Repeat</Badge></div>
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full"><UserPlus className="h-4 w-4 mr-1.5" />Create lead</Button>
                <Button variant="outline" size="sm" className="w-full"><StickyNote className="h-4 w-4 mr-1.5" />Add note</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}