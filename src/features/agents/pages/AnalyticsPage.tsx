import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "../data/mock";
import { PageHeader } from "../components/PageHeader";

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);
  const w = 220, h = 60;
  const step = w / (points.length - 1);
  const path = points.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * h}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16"><path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" /></svg>;
}

function Donut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  let acc = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 42 42" className="h-32 w-32">
        {segments.map((s) => {
          const pct = (s.value / total) * 100;
          const dash = `${pct} ${100 - pct}`;
          const el = <circle key={s.label} cx="21" cy="21" r="15.915" fill="transparent" stroke={s.color} strokeWidth="6" strokeDasharray={dash} strokeDashoffset={-acc} />;
          acc -= pct;
          return el;
        })}
      </svg>
      <div className="space-y-1 text-xs">
        {segments.map((s) => <div key={s.label} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{background:s.color}}/>{s.label}<span className="text-muted-foreground">· {s.value}</span></div>)}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const agents = db.agents.list();
  return (
    <div className="space-y-5">
      <PageHeader title="Analytics" description="Metrics across every agent, channel and workflow."
        actions={<div className="flex gap-1">{["7d","30d","90d","Custom"].map((r)=>(<Button key={r} size="sm" variant={r==="30d"?"default":"outline"}>{r}</Button>))}</div>} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Conversations over time</CardTitle></CardHeader><CardContent><Sparkline points={[40,52,48,61,73,68,82,91,88,97,105,120]} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Channel mix</CardTitle></CardHeader><CardContent><Donut segments={[
          { label: "WhatsApp", value: 48, color: "hsl(var(--primary))" },
          { label: "Web", value: 24, color: "hsl(var(--muted-foreground))" },
          { label: "Voice", value: 18, color: "#10b981" },
          { label: "Email", value: 10, color: "#f59e0b" },
        ]} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Handover rate trend</CardTitle></CardHeader><CardContent><Sparkline points={[8.1,7.8,7.5,7.2,6.9,6.7,6.5,6.4]} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Lead funnel</CardTitle></CardHeader><CardContent className="space-y-2">
          {[["New",96],["Qualified",64],["Booked",42],["Won",22]].map(([l,v]) => (
            <div key={l as string}><div className="flex justify-between text-xs mb-1"><span>{l}</span><span>{v}</span></div><div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{width:`${(v as number)/96*100}%`}}/></div></div>
          ))}
        </CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Per-agent breakdown</CardTitle></CardHeader>
        <Table>
          <TableHeader><TableRow><TableHead>Agent</TableHead><TableHead>Conversations</TableHead><TableHead>Leads</TableHead><TableHead>Handover</TableHead></TableRow></TableHeader>
          <TableBody>
            {agents.map((a)=>(<TableRow key={a.id}><TableCell className="font-medium">{a.name}</TableCell><TableCell>{a.conversationsToday}</TableCell><TableCell>{a.leadsThisWeek}</TableCell><TableCell>{a.handoverRate}%</TableCell></TableRow>))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}