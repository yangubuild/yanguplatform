import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAgents, useConversations, useLeads, useCalls } from "../data/hooks";
import { PageHeader } from "../components/PageHeader";
import type { Channel } from "../data/types";

const RANGES = [
  { id: "7d", label: "7d", days: 7 },
  { id: "30d", label: "30d", days: 30 },
  { id: "90d", label: "90d", days: 90 },
] as const;
type RangeId = (typeof RANGES)[number]["id"];

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);
  const w = 220, h = 60;
  const step = w / Math.max(points.length - 1, 1);
  const path = points.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * h}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16"><path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" /></svg>;
}

function Donut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 42 42" className="h-32 w-32">
        {segments.map((s) => {
          const pct = (s.value / total) * 100;
          const dash = `${pct} ${100 - pct}`;
          const el = <circle key={s.label} cx="21" cy="21" r="15.915" fill="transparent" stroke={s.color} strokeWidth="6" strokeDasharray={dash} strokeDashoffset={String(25 - acc)} />;
          acc += pct;
          return el;
        })}
      </svg>
      <div className="space-y-1 text-xs">
        {segments.map((s) => <div key={s.label} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />{s.label}<span className="text-muted-foreground">· {s.value}</span></div>)}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: "hsl(var(--primary))", web: "hsl(var(--muted-foreground))",
  voice: "#10b981", email: "#f59e0b", sms: "#6366f1", instagram: "#ec4899",
};

export default function AnalyticsPage() {
  const { data: agents = [] } = useAgents();
  const { data: conversations = [], isLoading: convLoading } = useConversations();
  const { data: leads = [] } = useLeads();
  const { data: calls = [] } = useCalls();
  const [range, setRange] = useState<RangeId>("30d");
  const days = RANGES.find((r) => r.id === range)!.days;

  const since = useMemo(() => Date.now() - days * 86_400_000, [days]);
  const convosInRange = useMemo(
    () => conversations.filter((c) => new Date(c.updatedAt).getTime() >= since),
    [conversations, since],
  );
  const leadsInRange = useMemo(
    () => leads.filter((l) => new Date(l.createdAt).getTime() >= since),
    [leads, since],
  );
  const callsInRange = useMemo(
    () => calls.filter((c) => new Date(c.when).getTime() >= since),
    [calls, since],
  );

  // Conversations per bucket across the selected window.
  const buckets = Math.min(days, 12);
  const series = useMemo(() => {
    const size = (days * 86_400_000) / buckets;
    const out = new Array(buckets).fill(0);
    for (const c of convosInRange) {
      const idx = Math.min(buckets - 1, Math.floor((new Date(c.updatedAt).getTime() - since) / size));
      if (idx >= 0) out[idx] += 1;
    }
    return out;
  }, [convosInRange, days, buckets, since]);

  const channelMix = useMemo(() => {
    const counts = new Map<Channel, number>();
    for (const c of convosInRange) counts.set(c.channel, (counts.get(c.channel) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value, color: CHANNEL_COLORS[label] ?? "hsl(var(--primary))" }));
  }, [convosInRange]);

  const handoverPct = convosInRange.length
    ? Math.round(
        (convosInRange.filter((c) => c.status === "handover" || c.status === "escalated" || c.status === "human").length /
          convosInRange.length) * 1000,
      ) / 10
    : 0;

  const funnel = useMemo(() => {
    const stages: Array<{ label: string; value: number }> = [
      { label: "New", value: leadsInRange.filter((l) => l.stage === "new").length },
      { label: "Qualified", value: leadsInRange.filter((l) => l.stage === "qualified").length },
      { label: "Booked", value: leadsInRange.filter((l) => l.stage === "booked").length },
      { label: "Won", value: leadsInRange.filter((l) => l.stage === "won").length },
    ];
    return stages;
  }, [leadsInRange]);
  const funnelMax = Math.max(...funnel.map((f) => f.value), 1);

  const perAgent = useMemo(() => agents.map((a) => ({
    id: a.id,
    name: a.name,
    conversations: convosInRange.filter((c) => c.agentId === a.id).length,
    calls: callsInRange.filter((c) => c.agentId === a.id).length,
    leads: leadsInRange.length && conversations.length
      ? leadsInRange.filter((l) => convosInRange.some((c) => c.agentId === a.id && c.contactName === l.name)).length
      : 0,
  })), [agents, convosInRange, callsInRange, leadsInRange, conversations.length]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        description={`Live metrics from your workspace — last ${days} days.`}
        actions={
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <Button key={r.id} size="sm" variant={r.id === range ? "default" : "outline"} onClick={() => setRange(r.id)}>
                {r.label}
              </Button>
            ))}
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Conversations over time</CardTitle></CardHeader>
          <CardContent>
            {convLoading ? <Empty text="Loading…" />
              : convosInRange.length === 0 ? <Empty text="No conversations in this period yet." />
              : <Sparkline points={series} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Channel mix</CardTitle></CardHeader>
          <CardContent>
            {channelMix.length === 0 ? <Empty text="No channel activity in this period yet." /> : <Donut segments={channelMix} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Handover rate</CardTitle></CardHeader>
          <CardContent>
            {convosInRange.length === 0
              ? <Empty text="Needs conversations before a handover rate can be measured." />
              : (
                <div>
                  <div className="text-3xl font-semibold">{handoverPct}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {convosInRange.filter((c) => c.status === "handover" || c.status === "escalated" || c.status === "human").length} of {convosInRange.length} conversations involved a human.
                  </p>
                </div>
              )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Lead funnel</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {leadsInRange.length === 0 ? <Empty text="No leads captured in this period yet." /> : funnel.map((f) => (
              <div key={f.label}>
                <div className="flex justify-between text-xs mb-1"><span>{f.label}</span><span>{f.value}</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(f.value / funnelMax) * 100}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Per-agent breakdown</CardTitle></CardHeader>
        <Table>
          <TableHeader><TableRow><TableHead>Agent</TableHead><TableHead>Conversations</TableHead><TableHead>Calls</TableHead><TableHead>Leads</TableHead></TableRow></TableHeader>
          <TableBody>
            {perAgent.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell>{a.conversations}</TableCell>
                <TableCell>{a.calls}</TableCell>
                <TableCell>{a.leads}</TableCell>
              </TableRow>
            ))}
            {perAgent.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground">No agents yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
