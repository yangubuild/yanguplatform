import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowUpRight, MessageCircle, PhoneCall, Calendar, TrendingUp, Bot, Plus } from "lucide-react";
import { db } from "../data/mock";
import { useAgents, useConversations } from "../data/hooks";
import { PageHeader, StatusDot } from "../components/PageHeader";

const channelIcon: Record<string, any> = { whatsapp: MessageCircle, web: MessageCircle, voice: PhoneCall, email: MessageCircle, sms: MessageCircle, instagram: MessageCircle };

export default function DashboardPage() {
  const kpis = db.kpis(); // KPIs stay on mock — see hooks module scope
  const { data: agents = [], isLoading: agentsLoading } = useAgents();
  const { data: convos = [] } = useConversations();
  const recent = convos.slice(0, 4);

  const kpiCards = [
    { label: "Conversations today", value: kpis.conversationsToday, delta: kpis.conversationsDelta, icon: MessageCircle },
    { label: "Leads this week", value: kpis.leadsThisWeek, delta: kpis.leadsDelta, icon: TrendingUp },
    { label: "Appointments booked", value: kpis.appointmentsBooked, delta: kpis.appointmentsDelta, icon: Calendar },
    { label: "Handover rate", value: `${kpis.handoverRate}%`, delta: kpis.handoverDelta, icon: PhoneCall },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good morning"
        description="Here's how your AI workforce is performing today."
        actions={
          <Button asChild>
            <Link to="/dashboard/agents/agents"><Plus className="h-4 w-4 mr-1.5" />Build a new agent</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                  <k.icon className="h-4 w-4" />
                </div>
                <span className="text-xs text-emerald-600 font-medium">{k.delta}</span>
              </div>
              <div className="text-2xl font-semibold">{k.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Your agents</h3>
        {agentsLoading && agents.length === 0 && (
          <p className="text-sm text-muted-foreground">Loading agents…</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{a.name}</CardTitle>
                      <p className="text-xs text-muted-foreground capitalize">{a.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5"><StatusDot status={a.status} /><span className="text-xs capitalize">{a.status}</span></div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1 mb-3">
                  {a.channels.map((c) => {
                    const Icon = channelIcon[c] ?? MessageCircle;
                    return <Badge key={c} variant="secondary" className="gap-1"><Icon className="h-3 w-3" />{c}</Badge>;
                  })}
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  {a.conversationsToday} chats today · {a.handoverRate}% handover
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={`/dashboard/agents/agents/${a.id}`}>Open builder<ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 && <p className="text-sm text-muted-foreground">No conversations yet.</p>}
            {recent.map((c) => (
              <div key={c.id} className="flex items-start gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-medium">{c.contactName.split(" ").map(x=>x[0]).join("").slice(0,2)}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{c.contactName}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                </div>
                <span className="text-xs text-muted-foreground">{c.channel}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Build a new agent</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Pick a template — Sales, Receptionist, Support or Knowledge — and be live in under 10 minutes.</p>
            <Button asChild><Link to="/dashboard/agents/agents"><Plus className="h-4 w-4 mr-1.5" />New agent</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}