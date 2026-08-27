import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Copy, Pause, Play, Phone } from "lucide-react";
import { useAgents, useCreateAgent, useUpdateAgent } from "../data/hooks";
import { PageHeader, StatusDot } from "../components/PageHeader";
import { YanguSpinner } from "../components/YanguSpinner";

const FILTERS = ["All", "Live", "Draft", "Paused", "Inbound", "Outbound", "Support"];


export default function AgentsListPage() {
  const [filter, setFilter] = useState("All");
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
        actions={<Button asChild><Link to="/dashboard/agents/agents/new"><Plus className="h-4 w-4 mr-1.5" />New agent</Link></Button>}
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f}</Button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && agents.length === 0 && (
          <div className="col-span-full flex items-center gap-2 text-sm text-muted-foreground p-8"><YanguSpinner size={16} />Loading agents…</div>
        )}
        {error && (
          <div className="col-span-full flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <span>Could not load agents.</span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        )}
        {!isLoading && agents.length === 0 && !error && (
          <div className="col-span-full rounded-lg border border-dashed border-border p-8 text-center">
            <Bot className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">No agents yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Describe what you need and Yangu will build your first AI employee.
            </p>
            <Button asChild className="mt-4"><Link to="/dashboard/agents/agents/new"><Plus className="h-4 w-4 mr-1.5" />New agent</Link></Button>
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
              <div className="flex flex-wrap items-center gap-1">
                {a.channels.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
                {a.phoneNumber && (
                  <span className="ml-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />{a.phoneNumber}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" className="flex-1"><Link to={`/dashboard/agents/agent/${a.id}`}>Open</Link></Button>
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

    </div>
  );
}