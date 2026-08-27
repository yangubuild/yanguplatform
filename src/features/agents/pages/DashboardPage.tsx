import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowUpRight, MessageCircle, PhoneCall, Calendar, TrendingUp, Bot, Plus } from "lucide-react";
import { useAgents, useAgentKpis, useOrgId } from "../data/hooks";
import { PageHeader, StatusDot } from "../components/PageHeader";
import { YanguSpinner } from "../components/YanguSpinner";

const channelIcon: Record<string, any> = { whatsapp: MessageCircle, web: MessageCircle, voice: PhoneCall, email: MessageCircle, sms: MessageCircle, instagram: MessageCircle };

export default function DashboardPage() {
  const { data: orgId } = useOrgId();
  const { data: agents = [], isLoading: agentsLoading } = useAgents();
  const { data: kpis, isLoading: kpisLoading } = useAgentKpis();

  const kpiCards = [
    { label: "Conversations today", value: kpis?.conversationsToday ?? 0, icon: MessageCircle },
    { label: "Leads this week",     value: kpis?.leadsThisWeek ?? 0,     icon: TrendingUp },
    { label: "Appointments booked", value: kpis?.appointmentsBooked ?? 0, icon: Calendar },
    { label: "Handover rate",       value: `${kpis?.handoverRate ?? 0}%`, icon: PhoneCall },
  ];
  const recent = kpis?.recent ?? [];

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
                {kpisLoading && orgId && <YanguSpinner size={14} />}
              </div>
              <div className="text-2xl font-semibold">{k.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Your agents</h3>
          {kpis && (
            <p className="text-xs text-muted-foreground">
              {kpis.agents.live} live · {kpis.agents.draft} draft · {kpis.agents.paused} paused
            </p>
          )}
        </div>
        {agentsLoading && agents.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><YanguSpinner size={16} />Loading agents…</p>
        )}
        {!agentsLoading && agents.length === 0 && (
          <Card><CardContent className="p-8 text-center">
            <Bot className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">No agents yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first AI Employee to start handling conversations.</p>
            <Button asChild className="mt-4"><Link to="/dashboard/agents/agents"><Plus className="h-4 w-4 mr-1.5" />New agent</Link></Button>
          </CardContent></Card>
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
            {recent.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            {recent.map((r) => (
              <div key={r.kind + r.id} className="flex items-start gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-medium capitalize">{r.kind[0]}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground truncate">{r.text}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(r.at).toLocaleDateString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Build a new agent</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Pick a template — Sales, Receptionist, Support or Knowledge — and be live in under 10 minutes.</p>
            <Button asChild><Link to="/dashboard/agents/agents"><Plus className="h-4 w-4 mr-1.5" />New agent</Link></Button>
            {kpis && (
              <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                <span>Usage this month: <span className="text-foreground font-medium">{kpis.usageThisMonth.toLocaleString()}</span></span>
                {Object.entries(kpis.channels).map(([c, n]) => <span key={c} className="capitalize">{c}: <span className="text-foreground font-medium">{n}</span></span>)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}