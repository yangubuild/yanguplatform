import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bot, Plus, Copy, Pause, Play, Loader2 } from "lucide-react";
import { useAgents, useCreateAgent, useUpdateAgent } from "../data/hooks";
import type { AgentType } from "../data/types";
import { PageHeader, StatusDot } from "../components/PageHeader";

const FILTERS = ["All", "Live", "Draft", "Paused", "Sales", "Receptionist", "Support", "Knowledge"];
const TEMPLATES: { id: AgentType; name: string; desc: string }[] = [
  { id: "sales", name: "Sales Agent", desc: "Qualifies leads, books demos, closes deals." },
  { id: "receptionist", name: "Receptionist", desc: "Answers calls, books appointments, takes messages." },
  { id: "support", name: "Support Agent", desc: "Resolves tickets, escalates when unsure." },
  { id: "knowledge", name: "Knowledge Agent", desc: "Answers from your knowledge base." },
];

export default function AgentsListPage() {
  const [filter, setFilter] = useState("All");
  const [picker, setPicker] = useState(false);
  const { data: allAgents = [], isLoading, error, refetch } = useAgents();
  const createMut = useCreateAgent();
  const updateMut = useUpdateAgent();
  const agents = allAgents.filter((a) => {
    if (filter === "All") return true;
    if (["Live", "Draft", "Paused"].includes(filter)) return a.status === filter.toLowerCase();
    return a.type === filter.toLowerCase();
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Agents"
        description="Manage all your AI employees in one place."
        actions={<Button onClick={() => setPicker(true)}><Plus className="h-4 w-4 mr-1.5" />New agent</Button>}
      />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f}</Button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && agents.length === 0 && (
          <div className="col-span-full flex items-center gap-2 text-sm text-muted-foreground p-8"><Loader2 className="h-4 w-4 animate-spin" />Loading agents…</div>
        )}
        {error && (
          <div className="col-span-full flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <span>Could not load agents.</span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        )}
        {!isLoading && agents.length === 0 && !error && (
          <div className="col-span-full rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No agents yet. Click <span className="font-medium">New agent</span> to build your first AI employee.
          </div>
        )}
        {agents.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Bot className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{a.type} agent</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5"><StatusDot status={a.status} /><span className="text-xs capitalize">{a.status}</span></div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>
              <div className="flex flex-wrap gap-1">
                {a.channels.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-border">
                <div><div className="text-sm font-semibold">{a.conversationsToday}</div><div className="text-[10px] text-muted-foreground">Today</div></div>
                <div><div className="text-sm font-semibold">{a.leadsThisWeek}</div><div className="text-[10px] text-muted-foreground">Leads</div></div>
                <div><div className="text-sm font-semibold">{a.handoverRate}%</div><div className="text-[10px] text-muted-foreground">Handover</div></div>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" className="flex-1"><Link to={`/dashboard/agents/agents/${a.id}`}>Open builder</Link></Button>
                <Button size="sm" variant="outline" aria-label="Duplicate"
                  onClick={() => createMut.mutate({ name: `${a.name} copy`, type: a.type, status: "draft", description: a.description, channels: a.channels, language: a.language, voice: a.voice })}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" aria-label={a.status === "paused" ? "Resume" : "Pause"}
                  onClick={() => updateMut.mutate({ id: a.id, patch: { status: a.status === "paused" ? "live" : "paused" } })}>
                  {a.status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={picker} onOpenChange={setPicker}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Pick a template</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {TEMPLATES.map((t) => (
              <Card key={t.id} className="cursor-pointer hover:border-primary transition"
                onClick={() => { createMut.mutate({ name: t.name, type: t.id, status: "draft", description: t.desc, channels: ["web"], language: "English" }); setPicker(false); }}>
                <CardContent className="p-4">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2"><Bot className="h-4 w-4" /></div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}