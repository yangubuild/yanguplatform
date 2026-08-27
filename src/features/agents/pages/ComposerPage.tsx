import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowUp, Bot, Loader2, Plus, Rocket, Sparkles, Trash2, Wrench, PanelRightClose, PanelRightOpen, TestTube2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useBuilderMessages, useBuilderThread, useBuilderThreads, useDeleteBuilderThread,
  useDeployAgent, useSaveDraftAgent, useSendBuilderTurn,
} from "../data/builderHooks";
import type { AgentDraftConfig, BuilderThread } from "../data/builderDb";

function summaryRows(c: AgentDraftConfig) {
  const rows: { label: string; value: string }[] = [];
  const push = (label: string, v: unknown) => {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) return;
    rows.push({ label, value: Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Enabled" : "Disabled") : String(v) });
  };
  push("Agent", c.agentName);
  push("Type", c.type);
  push("Business", c.businessName);
  push("Purpose", c.purpose);
  push("Languages", c.languages);
  push("Greeting", c.greeting);
  push("Hours", c.hours);
  push("Timezone", c.timezone);
  push("Appointments", c.appointments);
  push("Escalation", c.escalation);
  push("Human transfer", c.transferNumber);
  push("Voice", c.voice);
  push("Products / services", c.products);
  push("Qualification", c.qualificationQuestions);
  return rows;
}

function ConfigSummary({ thread }: { thread: BuilderThread | null | undefined }) {
  const rows = useMemo(() => summaryRows(thread?.config ?? {}), [thread?.config]);
  const status = thread?.status === "deployed" ? "Live" : thread?.status === "ready" ? "Ready" : "Draft";
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Agent configuration</p>
        <Badge variant={status === "Live" ? "default" : "secondary"}>{status}</Badge>
      </div>
      {rows.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Details appear here as you answer Yangu's questions.
        </p>
      )}
      <dl className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="border-b border-border/60 pb-2 last:border-0">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{r.label}</dt>
            <dd className="mt-0.5 break-words text-sm">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function ComposerPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [showPanel, setShowPanel] = useState(true);
  const [stage, setStage] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: threads = [] } = useBuilderThreads();
  const { data: thread } = useBuilderThread(threadId);
  const { data: messages = [], isLoading: msgsLoading } = useBuilderMessages(threadId);
  const turn = useSendBuilderTurn();
  const saveDraft = useSaveDraftAgent();
  const deploy = useDeployAgent();
  const removeThread = useDeleteBuilderThread();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, turn.isPending]);
  useEffect(() => { inputRef.current?.focus(); }, [threadId, turn.isPending]);

  async function send() {
    const value = text.trim();
    if (!value || turn.isPending) return;
    setText("");
    setStage("Understanding business requirements…");
    try {
      const result = await turn.mutateAsync({ threadId, text: value });
      if (!threadId) navigate(`/dashboard/agents/build/${result.threadId}`, { replace: true });
    } catch (e) {
      toast({ title: "Yangu AI couldn't respond", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally {
      setStage(null);
    }
  }

  async function onSaveDraft() {
    if (!thread) return;
    setStage("Saving draft…");
    try {
      const agentId = await saveDraft.mutateAsync(thread);
      toast({ title: "Draft saved", description: "Your agent configuration is stored. You can test it before deploying." });
      return agentId;
    } catch (e) {
      toast({ title: "Couldn't save the draft", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
      return null;
    } finally { setStage(null); }
  }

  async function onDeploy() {
    if (!thread) return;
    setStage("Saving draft…");
    const agentId = await onSaveDraft();
    if (!agentId) return;
    setStage("Deploying agent…");
    try {
      await deploy.mutateAsync(agentId);
      toast({ title: "Agent is live", description: "Your agent has been deployed. Assign a phone number to start taking calls." });
      navigate(`/dashboard/agents/agent/${agentId}`);
    } catch (e) {
      toast({
        title: "We couldn't deploy your agent",
        description: e instanceof Error ? e.message : "Your configuration has been saved as a draft.",
        variant: "destructive",
      });
    } finally { setStage(null); }
  }

  const ready = thread?.status === "ready" || thread?.status === "deployed";

  const threadList = (
    <div className="space-y-1">
      <Button asChild variant="outline" size="sm" className="w-full justify-start">
        <Link to="/dashboard/agents/agents/new"><Plus className="mr-1.5 h-4 w-4" />New thread</Link>
      </Button>
      {threads.map((t) => (
        <div
          key={t.id}
          className={cn(
            "group flex items-center gap-1 rounded-lg px-2 py-2 text-sm",
            t.id === threadId ? "bg-muted" : "hover:bg-muted/60",
          )}
        >
          <Link to={`/dashboard/agents/build/${t.id}`} className="min-w-0 flex-1">
            <p className="truncate font-medium">{t.title}</p>
            <p className="text-[11px] text-muted-foreground">
              {t.status === "deployed" ? "Live" : t.status === "ready" ? "Ready" : "Draft"} ·{" "}
              {new Date(t.updatedAt).toLocaleDateString()}
            </p>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Delete thread" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this setup thread?</AlertDialogTitle>
                <AlertDialogDescription>
                  The conversation will be removed. Any agent already saved from it stays untouched.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    await removeThread.mutateAsync(t.id);
                    if (t.id === threadId) navigate("/dashboard/agents/agents/new");
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_300px]">
      <aside className="hidden lg:block">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Threads</p>
        <ScrollArea className="h-[calc(100vh-14rem)] pr-1">{threadList}</ScrollArea>
      </aside>

      <section className="flex min-h-[60vh] flex-col">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">Threads</Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-xs overflow-y-auto">
                <p className="mb-3 text-sm font-semibold">Threads</p>
                {threadList}
              </SheetContent>
            </Sheet>
            <h2 className="truncate text-base font-semibold">{thread?.title ?? "Agent Builder"}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="xl:hidden">Configuration</Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm overflow-y-auto">
                <ConfigSummary thread={thread} />
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost" size="icon" aria-label="Toggle configuration panel"
              className="hidden xl:inline-flex" onClick={() => setShowPanel((v) => !v)}
            >
              {showPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 rounded-lg border border-border bg-card/40 p-3 sm:p-4">
          <div className="space-y-4">
            {msgsLoading && <p className="text-sm text-muted-foreground">Loading conversation…</p>}
            {!msgsLoading && messages.length === 0 && !turn.isPending && (
              <div className="py-10 text-center">
                <Wrench className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Agent Builder ready</p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                  Describe the agent you need — its role, languages, hours and how it should escalate.
                  Yangu will only ask for what's missing.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] space-y-1", m.role === "user" ? "text-right" : "")}>
                  {m.role === "assistant" && i === 0 && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Wrench className="h-3.5 w-3.5" />Loaded Agent Builder
                    </p>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "user" ? "bg-primary/10 text-foreground" : "bg-muted",
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
            {(turn.isPending || stage) && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {stage ?? "Working…"}
              </p>
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        {ready && (
          <Card className="mt-3 border-primary/40">
            <CardContent className="flex flex-wrap items-center gap-2 p-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="mr-auto text-sm font-medium">Agent Ready</p>
              <Button size="sm" variant="outline" onClick={onSaveDraft} disabled={saveDraft.isPending}>
                {saveDraft.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <TestTube2 className="mr-1.5 h-4 w-4" />}
                Save draft &amp; test
              </Button>
              {thread?.agentId && (
                <Button asChild size="sm" variant="outline">
                  <Link to={`/dashboard/agents/agents/${thread.agentId}`}>Edit configuration</Link>
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" disabled={deploy.isPending}>
                    {deploy.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Rocket className="mr-1.5 h-4 w-4" />}
                    Deploy agent
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deploy this agent?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Yangu will create the live voice agent from this configuration. No phone number is purchased —
                      you assign a number separately.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDeploy}>Deploy</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}

        <div className="relative mt-3">
          <Textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={2}
            placeholder="Answer Yangu, or add more detail…"
            className="min-h-[64px] resize-none rounded-lg pr-14"
          />
          <Button
            size="icon" aria-label="Send" onClick={send} disabled={!text.trim() || turn.isPending}
            className="absolute bottom-2.5 right-2.5 h-9 w-9 rounded-lg"
          >
            {turn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
        </div>
      </section>

      {showPanel && (
        <aside className="hidden xl:block">
          <Card>
            <CardContent className="p-4">
              <ConfigSummary thread={thread} />
              {!thread && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Bot className="h-3.5 w-3.5" />Describe your agent to begin.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      )}
    </div>
  );
}
