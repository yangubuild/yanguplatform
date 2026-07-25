import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bot, Plus, Copy, Pause, Play } from "lucide-react";
import { db } from "../data/mock";
import { PageHeader, StatusDot } from "../components/PageHeader";

const FILTERS = ["All", "Live", "Draft", "Paused", "Sales", "Receptionist", "Support", "Knowledge"];
const TEMPLATES = [
  { id: "sales", name: "Sales Agent", desc: "Qualifies leads, books demos, closes deals." },
  { id: "receptionist", name: "Receptionist", desc: "Answers calls, books appointments, takes messages." },
  { id: "support", name: "Support Agent", desc: "Resolves tickets, escalates when unsure." },
  { id: "knowledge", name: "Knowledge Agent", desc: "Answers from your knowledge base." },
];

export default function AgentsListPage() {
  const [filter, setFilter] = useState("All");
  const [picker, setPicker] = useState(false);
  const agents = db.agents.list().filter((a) => {
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
                <Button size="sm" variant="outline" aria-label="Duplicate"><Copy className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" aria-label={a.status === "paused" ? "Resume" : "Pause"}>
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
              <Card key={t.id} className="cursor-pointer hover:border-primary transition">
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