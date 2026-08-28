// Composer — the primary AI Agents workspace. One conversation surface that
// routes internally to skills (build, manage, call, campaigns, knowledge,
// leads, appointments, analytics, numbers) and renders contextual cards inline.

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowUp, Bot, Plus, Rocket, Trash2, TestTube2, AlertTriangle, RefreshCw,
  PanelRightClose, PanelRightOpen, PhoneOutgoing, BarChart3, Users, BookOpen, Wrench,
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
import type { AgentDraftConfig, BuilderThread, ComposerUi } from "../data/builderDb";
import { ComposerCard, SkillTag } from "../components/ComposerCards";
import { YanguSpinner } from "../components/YanguSpinner";


const SUGGESTIONS = [
  { icon: Bot, label: "Build an AI employee", prompt: "Build an AI receptionist for my business that answers calls and books appointments." },
  { icon: PhoneOutgoing, label: "Call a customer", prompt: "Call a customer for me to follow up on their enquiry." },
  { icon: Users, label: "Show my leads", prompt: "Show me the leads my agents captured this week." },
  { icon: BarChart3, label: "How are my agents doing?", prompt: "How are my agents performing this week?" },
  { icon: BookOpen, label: "Add business knowledge", prompt: "I want to give my agent knowledge about my prices and policies." },
  { icon: PhoneOutgoing, label: "Run a campaign", prompt: "Call my recent leads to follow up on their quotes." },
];

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
        <p className="text-sm font-semibold">Context</p>
        <Badge variant={status === "Live" ? "default" : "secondary"}>{status}</Badge>
      </div>
      {rows.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Details of what you're working on appear here as the conversation goes on.
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
  // Explicit failure state — a failed turn never leaves a silent spinner.
  const [lastError, setLastError] = useState<{ message: string; retry: string } | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stageTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const { data: threads = [] } = useBuilderThreads();
  const { data: thread } = useBuilderThread(threadId);
  const { data: messages = [], isLoading: msgsLoading } = useBuilderMessages(threadId);
  const turn = useSendBuilderTurn();
  const saveDraft = useSaveDraftAgent();
  const deploy = useDeployAgent();
  const removeThread = useDeleteBuilderThread();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, turn.isPending]);
  useEffect(() => { inputRef.current?.focus(); }, [threadId, turn.isPending]);
  useEffect(() => {
    stageTimersRef.current.forEach(clearTimeout);
    stageTimersRef.current = [];
    setStage(null);
    setLastError(null);
    return () => {
      stageTimersRef.current.forEach(clearTimeout);
      stageTimersRef.current = [];
    };
  }, [threadId]);

  async function send(value?: string) {
    const body = (value ?? text).trim();
    if (!body || turn.isPending) return;
    setText("");
    setLastError(null);
    // Visible execution stages so the user always knows what is happening.
    setStage("Understanding your request…");
    const t1 = setTimeout(() => setStage("Choosing the right skill…"), 1200);
    const t2 = setTimeout(() => setStage("Working on it…"), 4000);
    const t3 = setTimeout(() => setStage("Still working — almost there…"), 20000);
    stageTimersRef.current = [t1, t2, t3];
    try {
      const result = await turn.mutateAsync({ threadId, text: body });
      if (!threadId) navigate(`/dashboard/agents/build/${result.threadId}`, { replace: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Please try again.";
      setLastError({ message, retry: body });
      toast({ title: "Yangu AI couldn't respond", description: message, variant: "destructive" });
    } finally {
      [t1, t2, t3].forEach(clearTimeout);
      stageTimersRef.current = [];
      setStage(null);
    }
  }


  async function onSaveDraft() {
    if (!thread) return null;
    setStage("Saving draft…");
    try {
      const agentId = await saveDraft.mutateAsync(thread);
      toast({ title: "Draft saved", description: "Your agent is stored. You can test it before deploying." });
      return agentId;
    } catch (e) {
      toast({ title: "Couldn't save the draft", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
      return null;
    } finally { setStage(null); }
  }

  async function onDeploy() {
    if (!thread) return;
    const agentId = await onSaveDraft();
    if (!agentId) return;
    setStage("Deploying agent…");
    try {
      await deploy.mutateAsync(agentId);
      toast({ title: "Agent is live", description: "Your agent has been deployed. Give it a phone number to start taking calls." });
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
  const empty = !msgsLoading && messages.length === 0 && !turn.isPending;

  const threadList = (
    <div className="space-y-1">
      <Button asChild variant="outline" size="sm" className="w-full justify-start">
        <Link to="/dashboard/agents"><Plus className="mr-1.5 h-4 w-4" />New conversation</Link>
      </Button>
      {threads.length === 0 && (
        <p className="px-2 py-3 text-xs text-muted-foreground">
          {scope === "archived" ? "No archived conversations." : "Your conversations will be saved here."}
        </p>
      )}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon" variant="ghost" aria-label="Conversation options"
                className={cn(
                  "h-7 w-7 shrink-0 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100",
                  t.id === threadId && "lg:opacity-100",
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {scope === "active" ? (
                <>
                  <DropdownMenuItem onSelect={() => { setRenameFor(t); setRenameValue(t.title); }}>
                    <Pencil className="mr-2 h-4 w-4" />Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      toast({
                        title: "Share requires backend implementation",
                        description: "Secure conversation sharing isn't available yet, so no link was created.",
                      })
                    }
                  >
                    <Share2 className="mr-2 h-4 w-4" />Share
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={async () => {
                      try {
                        await archiveThread.mutateAsync({ id: t.id, archived: true });
                        if (t.id === threadId) navigate("/dashboard/agents");
                      } catch (e) {
                        toast({ title: "Couldn't archive", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
                      }
                    }}
                  >
                    <Archive className="mr-2 h-4 w-4" />Archive
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  onSelect={async () => {
                    try {
                      await archiveThread.mutateAsync({ id: t.id, archived: false });
                    } catch (e) {
                      toast({ title: "Couldn't restore", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
                    }
                  }}
                >
                  <ArchiveRestore className="mr-2 h-4 w-4" />Restore
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onSelect={() => setDeleteFor(t)}>
                <Trash2 className="mr-2 h-4 w-4" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );

  const scopeFilter = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
          {scope === "archived" ? "Archived" : "Active"}
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onSelect={() => setScope("active")}>Active</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setScope("archived")}>Archived</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_300px]">
      <Dialog open={!!renameFor} onOpenChange={(o) => { if (!o) setRenameFor(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Rename conversation</DialogTitle></DialogHeader>
          <Input
            value={renameValue}
            autoFocus
            maxLength={120}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void submitRename(); } }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameFor(null)}>Cancel</Button>
            <Button onClick={submitRename} disabled={renameThread.isPending || !renameValue.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteFor} onOpenChange={(o) => { if (!o) setDeleteFor(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and its messages. Agents, calls, leads,
              knowledge and appointments are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const target = deleteFor;
                setDeleteFor(null);
                if (!target) return;
                try {
                  await removeThread.mutateAsync(target.id);
                  if (target.id === threadId) navigate("/dashboard/agents");
                } catch (e) {
                  toast({ title: "Couldn't delete", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <aside className="hidden lg:block">
        <div className="mb-2 flex items-center justify-between gap-1 pl-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conversations</p>
          {scopeFilter}
        </div>
        <ScrollArea className="h-[calc(100vh-14rem)] pr-1">{threadList}</ScrollArea>
      </aside>

      <section className="flex min-h-[60vh] flex-col">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">Conversations</Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-xs overflow-y-auto">
                <p className="mb-3 text-sm font-semibold">Conversations</p>
                {threadList}
              </SheetContent>
            </Sheet>
            <h2 className="truncate text-base font-semibold">{thread?.title ?? "Composer"}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="xl:hidden">Context</Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm overflow-y-auto">
                <ConfigSummary thread={thread} />
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost" size="icon" aria-label="Toggle context panel"
              className="hidden xl:inline-flex" onClick={() => setShowPanel((v) => !v)}
            >
              {showPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 rounded-lg border border-border bg-card/40 p-3 sm:p-4">
          <div className="space-y-4">
            {msgsLoading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                <YanguSpinner size={16} />Loading conversation…
              </p>
            )}

            {empty && (
              <div className="py-8 text-center sm:py-12">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="h-5 w-5" />
                </div>

                <p className="mt-3 text-base font-semibold">What would you like to get done?</p>
                <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                  Ask for anything — build an AI employee, call a customer, run a follow-up campaign,
                  add business knowledge or review performance. Yangu handles the rest.
                </p>
                <div className="mx-auto mt-5 grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => send(s.prompt)}
                      className="flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
                    >
                      <s.icon className="h-4 w-4 shrink-0 text-primary" />
                      <span className="min-w-0 truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const meta = (m.metadata ?? {}) as { skillLabel?: string; ui?: ComposerUi | null };
              return (
                <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[92%] space-y-1 sm:max-w-[85%]", m.role === "user" && "text-right")}>
                    {m.role === "assistant" && <SkillTag label={meta.skillLabel} />}
                    <div
                      className={cn(
                        "rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                        m.role === "user" ? "bg-primary/10 text-foreground" : "bg-muted",
                      )}
                    >
                      {m.content}
                    </div>
                    {m.role === "assistant" && meta.ui && meta.ui.type !== "agent_ready" && (
                      <div className="text-left"><ComposerCard ui={meta.ui} /></div>
                    )}
                  </div>
                </div>
              );
            })}

            {(turn.isPending || stage) && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
                <YanguSpinner size={14} />
                {stage ?? "Working…"}
              </p>
            )}

            {lastError && !turn.isPending && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                <p className="mr-auto min-w-0 text-xs text-foreground">{lastError.message}</p>
                <Button size="sm" variant="outline" onClick={() => send(lastError.retry)}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Try again
                </Button>
              </div>
            )}

            <div ref={endRef} />
          </div>
        </ScrollArea>

        {ready && (
          <Card className="mt-3 border-primary/40">
            <CardContent className="flex flex-wrap items-center gap-2 p-4">
              <Wrench className="h-4 w-4 text-primary" />
              <p className="mr-auto text-sm font-medium">Agent ready</p>
              <Button size="sm" variant="outline" onClick={onSaveDraft} disabled={saveDraft.isPending}>
                {saveDraft.isPending ? <YanguSpinner size={16} className="mr-1.5" /> : <TestTube2 className="mr-1.5 h-4 w-4" />}
                Save draft &amp; test
              </Button>
              {thread?.agentId && (
                <Button asChild size="sm" variant="outline">
                  <Link to={`/dashboard/agents/agent/${thread.agentId}`}>Open agent</Link>
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" disabled={deploy.isPending}>
                    {deploy.isPending ? <YanguSpinner size={16} className="mr-1.5" /> : <Rocket className="mr-1.5 h-4 w-4" />}
                    Deploy agent
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deploy this agent?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Yangu will create the live agent from this configuration. No phone number is purchased —
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
            placeholder="Ask Yangu to build an agent, call someone, run a campaign…"
            className="min-h-[64px] resize-none rounded-lg pr-14"
          />
          <Button
            size="icon" aria-label="Send" onClick={() => send()} disabled={!text.trim() || turn.isPending}
            className="absolute bottom-2.5 right-2.5 h-9 w-9 rounded-lg"
          >
            {turn.isPending ? <YanguSpinner size={16} /> : <ArrowUp className="h-4 w-4" />}
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
                  <Bot className="h-3.5 w-3.5" />Start a conversation to begin.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      )}
    </div>
  );
}
