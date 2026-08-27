import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, AlertTriangle, Pause, Phone, PhoneCall, Play, RefreshCw, Rocket, Settings2, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAgent } from "../data/hooks";
import { useDeployAgent, useSetAgentRunState, useSyncAgentCalls } from "../data/builderHooks";
import { PageHeader, StatusDot } from "../components/PageHeader";
import { YanguSpinner } from "../components/YanguSpinner";
import { BrowserTestButton } from "../components/BrowserTestButton";
import { ComposerCard } from "../components/ComposerCards";
import { voiceOps } from "../data/builderDb";

interface CallRow {
  id: string;
  vapi_call_id: string | null;
  direction: string | null;
  caller_id: string | null;
  destination: string | null;
  status: string | null;
  outcome: string | null;
  duration_sec: number | null;
  cost: number | null;
  recording_url: string | null;
  transcript: string | null;
  started_at: string | null;
  ended_at: string | null;
  meta: any;
}

function useAgentCalls(agentId: string | undefined) {
  return useQuery({
    queryKey: ["agents", "calls", agentId],
    enabled: !!agentId,
    queryFn: async (): Promise<CallRow[]> => {
      const { data, error } = await (supabase as any)
        .from("agent_calls").select("*").eq("agent_id", agentId)
        .order("started_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as CallRow[];
    },
  });
}

function useAgentRow(agentId: string | undefined) {
  return useQuery({
    queryKey: ["agents", "row", agentId],
    enabled: !!agentId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agent_agents")
        .select("id, name, status, type, phone_number, vapi_assistant_id, deployed_at, last_deploy_error")
        .eq("id", agentId).maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
}

/** Real provider state for this agent — resolves to a definite answer. */
function useProviderStatus(agentId: string | undefined) {
  return useQuery({
    queryKey: ["agents", "provider-status", agentId],
    enabled: !!agentId,
    retry: 0,
    staleTime: 30_000,
    queryFn: () => voiceOps.agentStatus(agentId!),
  });
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

export default function AgentCommandCenterPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { data: agent } = useAgent(id);
  const { data: row, isLoading: rowLoading, isError: rowError, error: rowErrObj, refetch: refetchRow } = useAgentRow(id);
  const { data: calls = [], isLoading: callsLoading, isError: callsError, refetch } = useAgentCalls(id);
  const provider = useProviderStatus(id);

  const sync = useSyncAgentCalls();
  const runState = useSetAgentRunState();
  const deploy = useDeployAgent();
  const [openCall, setOpenCall] = useState<CallRow | null>(null);

  const stats = useMemo(() => {
    const ended = calls.filter((c) => c.duration_sec != null);
    const totalCost = calls.reduce((s, c) => s + (Number(c.cost) || 0), 0);
    const totalMin = ended.reduce((s, c) => s + (c.duration_sec ?? 0), 0) / 60;
    const failed = calls.filter((c) => ["no-answer", "failed", "customer-did-not-answer"].includes(String(c.outcome ?? ""))).length;
    return {
      calls: calls.length,
      avgDuration: ended.length ? Math.round(ended.reduce((s, c) => s + (c.duration_sec ?? 0), 0) / ended.length) : null,
      cost: totalCost,
      costPerMin: totalMin > 0 ? totalCost / totalMin : null,
      failed,
      completed: calls.length - failed,
    };
  }, [calls]);

  const name = row?.name ?? agent?.name ?? "Agent";
  const status = row?.status ?? agent?.status ?? "draft";
  const deployed = Boolean(row?.vapi_assistant_id);

  async function onSync() {
    try {
      const res: any = await sync.mutateAsync(id!);
      await refetch();
      toast({ title: "Call data synced", description: `${res?.synced ?? 0} call record(s) updated.` });
    } catch (e) {
      toast({ title: "Sync failed", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    }
  }

  // Every load resolves: agent, empty, or an explicit error with a retry.
  if (rowError) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="space-y-3 p-6">
          <p className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-destructive" />We couldn't load this agent
          </p>
          <p className="text-xs text-muted-foreground">
            {rowErrObj instanceof Error ? rowErrObj.message : "Please try again."}
          </p>
          <Button size="sm" variant="outline" onClick={() => refetchRow()}>
            <RefreshCw className="mr-1.5 h-4 w-4" />Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (rowLoading) {
    return (
      <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground" role="status">
        <YanguSpinner size={18} />Loading agent…
      </p>
    );
  }

  if (!row) {
    return (
      <div className="space-y-3">
        <EmptyState title="Agent not found" body="This agent may have been deleted, or it belongs to another workspace." />
        <Button asChild size="sm" variant="outline"><Link to="/dashboard/agents/agents">All agents</Link></Button>
      </div>
    );
  }

  return (

    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/dashboard/agents/agents"><ArrowLeft className="mr-1.5 h-4 w-4" />All agents</Link>
      </Button>

      <PageHeader
        title={name}
        description={`${String(row?.type ?? agent?.type ?? "inbound")} agent${row?.phone_number ? ` · ${row.phone_number}` : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs capitalize"><StatusDot status={status} />{status}</span>
            {deployed ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={runState.isPending}>
                    {status === "paused" ? <Play className="mr-1.5 h-4 w-4" /> : <Pause className="mr-1.5 h-4 w-4" />}
                    {status === "paused" ? "Resume" : "Pause"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{status === "paused" ? "Resume this agent?" : "Pause this agent?"}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {status === "paused"
                        ? "The agent will start answering calls again on its assigned number."
                        : "The agent will stop answering calls until you resume it."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          await runState.mutateAsync({ agentId: id!, next: status === "paused" ? "resume" : "pause" });
                          toast({ title: status === "paused" ? "Agent resumed" : "Agent paused" });
                        } catch (e) {
                          toast({ title: "Couldn't update the agent", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
                        }
                      }}
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                size="sm"
                disabled={deploy.isPending}
                onClick={async () => {
                  try {
                    await deploy.mutateAsync(id!);
                    toast({ title: "Agent is live" });
                  } catch (e) {
                    toast({
                      title: "We couldn't deploy your agent",
                      description: e instanceof Error ? e.message : "Your configuration has been saved as a draft.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                {deploy.isPending ? <YanguSpinner size={16} className="mr-1.5" /> : <Rocket className="mr-1.5 h-4 w-4" />}
                Deploy
              </Button>
            )}
            <Button asChild size="sm" variant="outline">
              <Link to={`/dashboard/agents/agents/${id}`}><Settings2 className="mr-1.5 h-4 w-4" />Configure</Link>
            </Button>
          </div>
        }
      />

      {row?.last_deploy_error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm">
            The last deployment attempt didn't complete. Your configuration is saved — try deploying again, or adjust the configuration first.
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calls">Calls</TabsTrigger>
          <TabsTrigger value="phone">Phone number</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Voice provider mapping — always a definite answer, never a spinner. */}
          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="mr-auto text-sm font-semibold">Voice status</p>
                {provider.isFetching && <YanguSpinner size={14} />}
                <Button size="sm" variant="ghost" onClick={() => provider.refetch()}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Recheck
                </Button>
              </div>
              {provider.isLoading ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
                  <YanguSpinner size={14} />Checking voice setup…
                </p>
              ) : provider.isError ? (
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                  {provider.error instanceof Error ? provider.error.message : "Voice status is unavailable right now."}
                </p>
              ) : provider.data?.state === "deployed" ? (
                <>
                  <p className="flex items-center gap-1.5 text-xs text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />Live on the voice network
                  </p>
                  <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div><dt className="text-muted-foreground">Voice</dt><dd>{provider.data.provider?.voice ?? "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Understanding</dt><dd>{provider.data.provider?.transcriber ?? "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Number</dt><dd>{provider.data.phoneNumber ?? "Not assigned"}</dd></div>
                    <div><dt className="text-muted-foreground">Last updated</dt><dd>{provider.data.provider?.updatedAt ? new Date(provider.data.provider.updatedAt).toLocaleString() : "—"}</dd></div>
                  </dl>
                  {provider.data.provider?.firstMessage && (
                    <p className="rounded-lg bg-muted p-2 text-xs">“{provider.data.provider.firstMessage}”</p>
                  )}
                  <BrowserTestButton agentId={id!} />
                </>
              ) : (
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                  {provider.data?.message ?? "Not deployed to voice provider."}
                </p>
              )}
            </CardContent>
          </Card>

          {callsLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <YanguSpinner size={16} />Loading call data…
            </p>
          ) : callsError ? (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="flex flex-wrap items-center gap-2 p-4">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="mr-auto text-sm">Call data couldn't be loaded.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()}>Try again</Button>
              </CardContent>
            </Card>
          ) : calls.length === 0 ? (
            <EmptyState
              title="No call data yet"
              body={deployed
                ? "Once this agent handles real calls, metrics, transcripts and recordings appear here."
                : "Deploy this agent and connect a phone number to start collecting real call data."}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Calls" value={String(stats.calls)} />
              <Metric label="Average duration" value={stats.avgDuration != null ? `${stats.avgDuration}s` : "—"} />
              <Metric label="Cost" value={stats.cost ? `$${stats.cost.toFixed(2)}` : "—"} hint={stats.costPerMin ? `$${stats.costPerMin.toFixed(4)}/min` : undefined} />
              <Metric label="Completed / unanswered" value={`${stats.completed} / ${stats.failed}`} />
            </div>
          )}
          <div>
            <Button size="sm" variant="outline" onClick={onSync} disabled={sync.isPending || !deployed}>
              {sync.isPending ? <YanguSpinner size={16} className="mr-1.5" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
              Sync call data
            </Button>
          </div>
        </TabsContent>

        </TabsContent>

        <TabsContent value="calls" className="mt-4 space-y-3">
          {calls.length === 0 && <EmptyState title="No calls recorded" body="Call history appears here after this agent handles its first call." />}
          {calls.map((c) => (
            <Card key={c.id} role="button" tabIndex={0} onClick={() => setOpenCall(c)}
              onKeyDown={(e) => { if (e.key === "Enter") setOpenCall(c); }}
              className="cursor-pointer transition-colors hover:border-primary">
              <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 text-sm">
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{c.caller_id ?? c.destination ?? "Unknown number"}</span>
                <Badge variant="secondary" className="capitalize">{c.direction ?? "inbound"}</Badge>
                <span className="text-muted-foreground">{c.started_at ? new Date(c.started_at).toLocaleString() : "—"}</span>
                <span className="text-muted-foreground">{c.duration_sec != null ? `${c.duration_sec}s` : "—"}</span>
                <span className="text-muted-foreground capitalize">{c.outcome ?? c.status ?? "—"}</span>
                {c.cost != null && <span className="text-muted-foreground">${Number(c.cost).toFixed(3)}</span>}
              </CardContent>
            </Card>
          ))}

          {openCall && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  {openCall.caller_id ?? openCall.destination ?? "Call"} · transcript
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setOpenCall(null)}>Close</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {openCall.recording_url && (
                  <audio controls src={openCall.recording_url} className="w-full">
                    Your browser does not support audio playback.
                  </audio>
                )}
                {Array.isArray(openCall.meta?.messages) && openCall.meta.messages.length > 0 ? (
                  <div className="space-y-2">
                    {openCall.meta.messages
                      .filter((m: any) => m.role === "bot" || m.role === "user" || m.role === "assistant")
                      .map((m: any, i: number) => (
                        <div key={i} className={m.role === "user" ? "text-right" : ""}>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            {m.role === "user" ? "Customer" : "AI agent"}
                          </p>
                          <p className="inline-block rounded-lg bg-muted px-3 py-2 text-sm">{m.message ?? m.content}</p>
                        </div>
                      ))}
                  </div>
                ) : openCall.transcript ? (
                  <pre className="whitespace-pre-wrap break-words text-sm">{openCall.transcript}</pre>
                ) : (
                  <p className="text-sm text-muted-foreground">No transcript is available for this call.</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="phone" className="mt-4 space-y-3">
          {row?.phone_number && (
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{row.phone_number}</p>
                  <p className="text-xs text-muted-foreground">Assigned to this agent</p>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Live number manager: list, connect and assign real numbers. */}
          <ComposerCard ui={{ type: "phone_numbers", agent: row }} />
        </TabsContent>

        <TabsContent value="knowledge" className="mt-4">
          <Card>
            <CardContent className="p-6 text-sm">
              This agent draws on your existing Yangu knowledge base.
              <Button asChild variant="link" className="px-1.5">
                <Link to="/dashboard/agents/knowledge">Manage knowledge</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="mt-4 space-y-3">
          <Card>
            <CardContent className="space-y-2 p-5 text-sm">
              <p className="font-medium">Connection check</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>Agent record: {row ? "loaded" : "missing"}</li>
                <li>Deployed to voice network: {provider.data?.state === "deployed" ? "yes" : "no"}</li>
                <li>Assigned number: {row?.phone_number ?? "none"}</li>
                <li>Call records stored: {calls.length}</li>
                <li>Last deployment: {row?.deployed_at ? new Date(row.deployed_at).toLocaleString() : "never"}</li>
              </ul>
              <Button size="sm" variant="outline" onClick={() => { provider.refetch(); refetch(); }}>
                <RefreshCw className="mr-1.5 h-4 w-4" />Recheck now
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
