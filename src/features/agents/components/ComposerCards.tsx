// Contextual cards the Composer renders inline under an assistant reply.
// Every card acts on real workspace data — there are no placeholder controls.

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight, BarChart3, BookOpen, Bot, Calendar, CheckCircle2, AlertTriangle, Plus, Link2,
  PhoneCall, PhoneOutgoing, Play, Pause, Phone, Users, Volume2, Languages, MessageSquareQuote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { updateAgentFields, voiceOps, type ComposerUi, type VoiceCallState, type VoiceNumber } from "../data/builderDb";
import { YanguSpinner } from "./YanguSpinner";
import { useSetAgentRunState } from "../data/builderHooks";
import { useOrgId } from "../data/hooks";

const VOICES = ["Elliot", "Kylie", "Rohan", "Lily", "Savannah", "Hana", "Cole", "Paige", "Spencer"];
const LANGUAGES = ["English", "Arabic", "Swahili", "French", "Hindi", "Urdu", "Portuguese"];

const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString() : "—");

function CardShell({ icon: Icon, title, children, action }: {
  icon: React.ElementType; title: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <Card className="mt-2 border-border/70">
      <CardContent className="space-y-3 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <p className="mr-auto text-sm font-semibold">{title}</p>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function Rows({ items }: { items: { key: string; primary: string; secondary?: string; right?: React.ReactNode; to?: string }[] }) {
  return (
    <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
      {items.map((r) => (
        <li key={r.key} className="flex items-center gap-3 px-3 py-2 text-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{r.primary}</p>
            {r.secondary && <p className="truncate text-xs text-muted-foreground">{r.secondary}</p>}
          </div>
          {r.right}
          {r.to && (
            <Button asChild size="icon" variant="ghost" className="h-7 w-7" aria-label={`Open ${r.primary}`}>
              <Link to={r.to}><ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ComposerCard({ ui }: { ui: ComposerUi }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const runState = useSetAgentRunState();
  const { data: orgId } = useOrgId();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const agent = (ui.agent ?? null) as any;
  const agents = (ui.agents ?? []) as any[];

  // local editable state per card type
  const [voice, setVoice] = useState<string>(String(agent?.voice ?? "Elliot"));
  const [greeting, setGreeting] = useState<string>(String(ui.greeting ?? ""));
  const [langs, setLangs] = useState<string[]>(agent?.language ? [String(agent.language)] : ["English"]);
  const [to, setTo] = useState<string>(String(ui.to ?? ""));
  const [callPurpose, setCallPurpose] = useState<string>(String(ui.purpose ?? ""));
  const [campaignAgent, setCampaignAgent] = useState<string>(agents[0]?.id ?? "");
  const [picked, setPicked] = useState<string[]>([]);
  const [numbers, setNumbers] = useState<VoiceNumber[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Real outbound-call lifecycle, polled from the voice provider.
  const [placed, setPlaced] = useState<{ callId: string; status: string; from: string | null; to: string } | null>(null);
  const [callState, setCallState] = useState<VoiceCallState | null>(null);
  const callPolls = useRef(0);
  const [callStatusUnknown, setCallStatusUnknown] = useState(false);
  // Connect-a-number flow (both options are explicitly confirmed by the user).
  const [connectMode, setConnectMode] = useState<"none" | "new" | "import">("none");
  const [areaCode, setAreaCode] = useState("");
  const [importNumber, setImportNumber] = useState("");
  const [importSid, setImportSid] = useState("");
  const [importToken, setImportToken] = useState("");

  const contacts = (ui.contacts ?? []) as any[];
  const calls = (ui.calls ?? []) as any[];
  const leads = (ui.leads ?? []) as any[];
  const appointments = (ui.appointments ?? []) as any[];
  const sources = (ui.sources ?? []) as any[];
  const totals = (ui.totals ?? {}) as Record<string, number>;
  const agentName = useMemo(() => new Map(agents.map((a) => [a.id, a.name])), [agents]);

  const fail = (e: unknown) => {
    setError(e instanceof Error ? e.message : "Please try again.");
    toast({
      title: "That didn't go through",
      description: e instanceof Error ? e.message : "Please try again.",
      variant: "destructive",
    });
  };

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setDone(label);
      qc.invalidateQueries({ queryKey: ["agents"] });
    } catch (e) { fail(e); } finally { setBusy(false); }
  }

  // Poll the placed call until it reaches a terminal state — real status only.
  useEffect(() => {
    if (!placed || !agent?.id) return;
    callPolls.current = 0;
    setCallStatusUnknown(false);
    const terminal = ["ended", "failed", "busy", "no-answer", "canceled"];
    if (callState && terminal.includes(String(callState.status))) return;
    const t = setInterval(async () => {
      callPolls.current += 1;
      if (callPolls.current > 24) {
        clearInterval(t);
        setCallStatusUnknown(true);
        return;
      }
      try {
        const s = await voiceOps.getCall(agent.id, placed.callId);
        setCallState(s);
        if (terminal.includes(String(s.status))) clearInterval(t);
      } catch {
        if (callPolls.current >= 3) {
          clearInterval(t);
          setCallStatusUnknown(true);
        }
      }
    }, 5000);
    return () => clearInterval(t);
  }, [placed, agent?.id, callState?.status]);

  // Outbound readiness: never offer "Call now" unless the workspace really has a
  // provider number that can dial the destination.
  const [readiness, setReadiness] = useState<{ loading: boolean; numbers: VoiceNumber[] } | null>(null);
  useEffect(() => {
    if (ui.type !== "call_confirm" || placed) return;
    let live = true;
    setReadiness({ loading: true, numbers: [] });
    voiceOps
      .listNumbers(orgId ?? undefined)
      .then((res) => { if (live) setReadiness({ loading: false, numbers: res?.numbers ?? [] }); })
      .catch(() => { if (live) setReadiness({ loading: false, numbers: [] }); });
    return () => { live = false; };
  }, [ui.type, placed, orgId]);

  const destination = to.trim();
  const outboundNumbers = (readiness?.numbers ?? []).filter((n) => n.outboundCapable);
  // Yangu-issued (Vapi) numbers are US numbers and cannot dial most international
  // destinations — a carrier-imported number is required for those.
  const isInternational = destination.replace(/[^\d+]/g, "").startsWith("+") && !destination.replace(/[^\d+]/g, "").startsWith("+1");
  const usableNumbers = isInternational ? outboundNumbers.filter((n) => n.provider !== "vapi") : outboundNumbers;
  const callReady = !readiness?.loading && usableNumbers.length > 0;

  const errorBanner = error ? (
    <p className="flex items-start gap-1.5 text-xs text-destructive">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{error}
    </p>
  ) : null;

  // Reusable "connect a number" panel. Both paths are chargeable, so each is
  // confirmed explicitly and carrier credentials go straight to the provider.
  const connectNumberPanel = (
    <div className="space-y-2 rounded-lg border border-border/60 p-3">
      {connectMode === "none" && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setConnectMode("import")}>
            <Link2 className="mr-1.5 h-4 w-4" />Connect my own number
          </Button>
          <Button size="sm" variant="outline" onClick={() => setConnectMode("new")}>
            <Plus className="mr-1.5 h-4 w-4" />Get a new number
          </Button>
        </div>
      )}
      {connectMode === "new" && (
        <>
          <p className="text-xs text-muted-foreground">
            New numbers issued by Yangu are US numbers (+1), best for testing and US dialling. For UAE or
            other countries, connect a number from your own carrier. Creating a number may incur charges.
          </p>
          <div>
            <Label className="text-xs">Preferred area code (optional)</Label>
            <Input value={areaCode} onChange={(e) => setAreaCode(e.target.value)} inputMode="numeric" placeholder="415" className="rounded-lg" />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm" disabled={busy}
              onClick={() => run("Number created and added to your workspace.", async () => {
                await voiceOps.createNumber({ areaCode: areaCode || undefined });
                const res = await voiceOps.listNumbers(orgId ?? undefined);
                setNumbers(res?.numbers ?? []);
                setReadiness({ loading: false, numbers: res?.numbers ?? [] });
                setConnectMode("none");
              })}
            >
              {busy && <YanguSpinner size={16} className="mr-1.5" />}Confirm &amp; create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConnectMode("none")}>Cancel</Button>
          </div>
        </>
      )}
      {connectMode === "import" && (
        <>
          <p className="text-xs text-muted-foreground">
            Connect a number you already own with your carrier (Twilio). Your carrier credentials are passed
            straight to the voice infrastructure and are never stored by Yangu.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <Label className="text-xs">Number</Label>
              <Input value={importNumber} onChange={(e) => setImportNumber(e.target.value)} placeholder="+971501234567" className="rounded-lg" />
            </div>
            <div>
              <Label className="text-xs">Account SID</Label>
              <Input value={importSid} onChange={(e) => setImportSid(e.target.value)} className="rounded-lg" />
            </div>
            <div>
              <Label className="text-xs">Auth token</Label>
              <Input type="password" value={importToken} onChange={(e) => setImportToken(e.target.value)} className="rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm" disabled={busy || !importNumber.trim() || !importSid.trim() || !importToken.trim()}
              onClick={() => run("Number connected to your workspace.", async () => {
                await voiceOps.importNumber({
                  number: importNumber.trim(), accountSid: importSid.trim(), authToken: importToken.trim(),
                });
                setImportToken("");
                const res = await voiceOps.listNumbers(orgId ?? undefined);
                setNumbers(res?.numbers ?? []);
                setReadiness({ loading: false, numbers: res?.numbers ?? [] });
                setConnectMode("none");
              })}
            >
              {busy && <YanguSpinner size={16} className="mr-1.5" />}Confirm &amp; connect
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConnectMode("none")}>Cancel</Button>
          </div>
        </>
      )}
    </div>
  );

  if (done) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-primary">
        <CheckCircle2 className="h-3.5 w-3.5" />{done}
      </p>
    );
  }

  switch (ui.type) {
    case "agent_list":
      return (
        <CardShell icon={Bot} title={agents.length === 1 ? "Agent" : "Your AI employees"}>
          <Rows
            items={agents.map((a) => ({
              key: a.id,
              primary: a.name,
              secondary: `${a.type} · ${a.status}${a.phone_number ? ` · ${a.phone_number}` : ""}`,
              right: <Badge variant={a.status === "live" ? "default" : "secondary"} className="capitalize">{a.status}</Badge>,
              to: `/dashboard/agents/agent/${a.id}`,
            }))}
          />
        </CardShell>
      );

    case "voice_selector":
      return (
        <CardShell icon={Volume2} title={`Voice for ${agent?.name ?? "agent"}`}>
          <div className="flex flex-wrap gap-2">
            {VOICES.map((v) => (
              <Button key={v} size="sm" variant={voice === v ? "default" : "outline"} onClick={() => setVoice(v)}>
                {v}
              </Button>
            ))}
          </div>
          <Button
            size="sm" disabled={busy || !agent}
            onClick={() => run(`Voice updated to ${voice}.`, () => updateAgentFields(agent.id, { voice }))}
          >
            {busy && <YanguSpinner size={16} className="mr-1.5" />}Save voice
          </Button>
        </CardShell>
      );

    case "greeting_editor":
      return (
        <CardShell icon={MessageSquareQuote} title={`Greeting for ${agent?.name ?? "agent"}`}>
          <Textarea
            value={greeting} onChange={(e) => setGreeting(e.target.value)} rows={3}
            placeholder="Thank you for calling — how can I help?"
            className="resize-none rounded-lg"
          />
          <Button
            size="sm" disabled={busy || !greeting.trim() || !agent}
            onClick={() => run("Greeting updated.", () => updateAgentFields(agent.id, { greeting: greeting.trim() }))}
          >
            {busy && <YanguSpinner size={16} className="mr-1.5" />}Save greeting
          </Button>
        </CardShell>
      );

    case "language_selector":
      return (
        <CardShell icon={Languages} title={`Languages for ${agent?.name ?? "agent"}`}>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <Button
                key={l} size="sm" variant={langs.includes(l) ? "default" : "outline"}
                onClick={() => setLangs((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p, l]))}
              >
                {l}
              </Button>
            ))}
          </div>
          <Button
            size="sm" disabled={busy || !langs.length || !agent}
            onClick={() => run(`Languages updated: ${langs.join(", ")}.`, () => updateAgentFields(agent.id, { languages: langs }))}
          >
            {busy && <YanguSpinner size={16} className="mr-1.5" />}Save languages
          </Button>
        </CardShell>
      );

    case "agent_run_state": {
      const next = String(ui.next) === "pause" ? "pause" : "resume";
      return (
        <CardShell icon={next === "pause" ? Pause : Play} title={`${next === "pause" ? "Pause" : "Resume"} ${agent?.name ?? "agent"}`}>
          <Button
            size="sm" disabled={runState.isPending || !agent}
            onClick={() =>
              run(next === "pause" ? "Agent paused." : "Agent resumed.", () =>
                runState.mutateAsync({ agentId: agent.id, next: next as "pause" | "resume" }))
            }
          >
            {runState.isPending && <YanguSpinner size={16} className="mr-1.5" />}
            {next === "pause" ? "Pause agent" : "Resume agent"}
          </Button>
        </CardShell>
      );
    }

    case "call_confirm":
      return (
        <CardShell icon={PhoneOutgoing} title={`Place a call with ${agent?.name ?? "your agent"}`}>
          {placed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {callStatusUnknown || ["ended", "failed", "busy", "no-answer", "canceled"].includes(String(callState?.status ?? placed.status))
                  ? <CheckCircle2 className="h-4 w-4 text-primary" />
                  : <YanguSpinner size={16} />}
                <p className="text-sm font-medium capitalize">
                  {callStatusUnknown ? "Status unavailable — check Calls" : String(callState?.status ?? placed.status).replace(/-/g, " ")}
                </p>
                <Badge variant="secondary" className="ml-auto">{placed.to}</Badge>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div><dt className="text-muted-foreground">From</dt><dd>{placed.from ?? "—"}</dd></div>
                <div><dt className="text-muted-foreground">Duration</dt><dd>{callState?.durationSec != null ? `${callState.durationSec}s` : "—"}</dd></div>
                <div><dt className="text-muted-foreground">Result</dt><dd className="capitalize">{callState?.endedReason?.replace(/-/g, " ") ?? "In progress"}</dd></div>
                <div><dt className="text-muted-foreground">Cost</dt><dd>{callState?.cost != null ? `$${Number(callState.cost).toFixed(3)}` : "—"}</dd></div>
              </dl>
              {callState?.summary && <p className="rounded-lg bg-muted p-2 text-xs">{callState.summary}</p>}
              {callState?.recordingUrl && (
                <a href={callState.recordingUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                  Listen to the recording
                </a>
              )}
              <Button asChild size="sm" variant="outline">
                <Link to={`/dashboard/agents/agent/${agent?.id}`}>Open agent</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Number to call</Label>
                  <Input
                    value={to} onChange={(e) => setTo(e.target.value)} inputMode="tel"
                    placeholder="+971 50 123 4567" className="rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs">Purpose</Label>
                  <Input
                    value={callPurpose} onChange={(e) => setCallPurpose(e.target.value)}
                    placeholder="Follow up on the quote" className="rounded-lg"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {readiness?.loading
                  ? "Checking your outbound calling setup…"
                  : callReady
                    ? `Calling from ${usableNumbers[0]?.number ?? agent?.phone_number ?? "your connected number"}. Nothing is dialled until you press Call now.`
                    : outboundNumbers.length > 0 && isInternational
                      ? "Your only connected number is a Yangu-issued US number, which cannot dial this country. Connect a number from your own carrier to call internationally."
                      : "No outbound phone number is connected yet, so calls cannot be placed. Connect a number to enable calling."}
              </p>
              {errorBanner}
              {callReady ? (
                <Button
                  size="sm" disabled={busy || !destination || !agent}
                  onClick={async () => {
                    setBusy(true); setError(null);
                    try {
                      const res = await voiceOps.placeCall({
                        agentId: agent.id, to: destination,
                        name: String(ui.person ?? "") || undefined,
                        purpose: callPurpose || undefined,
                      });
                      setPlaced({ callId: res.callId, status: res.status, from: res.from, to: res.to });
                      qc.invalidateQueries({ queryKey: ["agents"] });
                    } catch (e) { fail(e); } finally { setBusy(false); }
                  }}
                >
                  {busy ? <YanguSpinner size={16} className="mr-1.5" /> : <PhoneCall className="mr-1.5 h-4 w-4" />}
                  Call now
                </Button>
              ) : readiness?.loading ? (
                <YanguSpinner size={18} />
              ) : (
                connectNumberPanel
              )}
            </>
          )}
        </CardShell>
      );



    case "call_list":
      return (
        <CardShell
          icon={PhoneCall} title="Calls"
          action={<Button asChild size="sm" variant="ghost"><Link to="/dashboard/agents/calls">All calls</Link></Button>}
        >
          <Rows
            items={calls.map((c) => ({
              key: c.id,
              primary: `${c.direction === "outbound" ? "To" : "From"} ${c.destination ?? c.caller_id ?? "unknown"}`,
              secondary: `${agentName.get(c.agent_id) ?? "Agent"} · ${fmt(c.started_at)} · ${c.duration_sec ? `${Math.round(c.duration_sec / 60)} min` : "—"}`,
              right: (
                <Badge
                  variant={["failed", "no-answer", "busy", "error"].includes(String(c.status)) ? "destructive" : "secondary"}
                  className="capitalize"
                >
                  {c.outcome ?? c.status ?? "—"}
                </Badge>
              ),
            }))}
          />
        </CardShell>
      );

    case "lead_list":
      return (
        <CardShell
          icon={Users} title="Leads"
          action={<Button asChild size="sm" variant="ghost"><Link to="/dashboard/agents/leads">All leads</Link></Button>}
        >
          <Rows
            items={leads.map((l) => ({
              key: l.id,
              primary: l.name,
              secondary: [l.phone, l.email, l.intent].filter(Boolean).join(" · ") || fmt(l.created_at),
              right: <Badge variant="secondary">{l.stage}</Badge>,
            }))}
          />
        </CardShell>
      );

    case "appointment_list":
      return (
        <CardShell
          icon={Calendar} title="Appointments"
          action={<Button asChild size="sm" variant="ghost"><Link to="/dashboard/agents/appointments">Calendar</Link></Button>}
        >
          <Rows
            items={appointments.map((a) => ({
              key: a.id,
              primary: a.title,
              secondary: `${a.contact_name ?? "Customer"} · ${fmt(a.scheduled_at)} · ${a.duration_min} min`,
              right: <Badge variant="secondary" className="capitalize">{a.status}</Badge>,
            }))}
          />
        </CardShell>
      );

    case "analytics":
      return (
        <CardShell
          icon={BarChart3} title="Performance"
          action={<Button asChild size="sm" variant="ghost"><Link to="/dashboard/agents/analytics">Full analytics</Link></Button>}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { label: "Calls", value: totals.calls ?? 0 },
              { label: "Connected", value: totals.connected ?? 0 },
              { label: "Minutes", value: totals.minutes ?? 0 },
              { label: "Unanswered", value: totals.failed ?? 0 },
              { label: "Live agents", value: totals.live ?? 0 },
              { label: "Spend", value: `${totals.cost ?? 0}` },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-border/60 p-3">
                <p className="text-lg font-semibold">{m.value}</p>
                <p className="text-[11px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </CardShell>
      );

    case "knowledge_panel":
      return (
        <CardShell
          icon={BookOpen} title={agent ? `Knowledge for ${agent.name}` : "Business knowledge"}
          action={<Button asChild size="sm" variant="ghost"><Link to="/dashboard/agents/knowledge">Manage</Link></Button>}
        >
          {sources.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nothing added yet. Paste your prices, policies or FAQs into the message box and I'll store them,
              or open Manage to upload a document.
            </p>
          ) : (
            <Rows
              items={sources.map((s) => ({
                key: s.id,
                primary: s.name,
                secondary: `${s.kind ?? "text"} · ${fmt(s.created_at)}`,
                right: <Badge variant="secondary" className="capitalize">{s.status ?? "ready"}</Badge>,
              }))}
            />
          )}
        </CardShell>
      );

    case "phone_numbers": {
      const list: VoiceNumber[] = numbers ?? ((ui.numbers as VoiceNumber[]) ?? []);
      return (
        <CardShell
          icon={Phone} title="Phone numbers"
          action={
            <Button
              size="sm" variant="outline" disabled={busy}
              onClick={async () => {
                setBusy(true); setError(null);
                try {
                  const res = await voiceOps.listNumbers(orgId ?? undefined);
                  setNumbers(res?.numbers ?? []);
                } catch (e) { fail(e); } finally { setBusy(false); }
              }}
            >
              {busy ? <YanguSpinner size={16} /> : "Refresh"}
            </Button>
          }
        >
          {errorBanner}
          {list.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No phone number connected yet. Connect one below, then assign it to an agent so it can take
              and place calls.
            </p>
          ) : (
            <Rows
              items={list.map((n) => ({
                key: n.id,
                primary: n.number ?? "Number",
                secondary: [
                  n.assistantId ? "Assigned" : "Available",
                  n.provider === "vapi" ? "Yangu-issued (US dialling)" : `Your carrier (${n.provider})`,
                  n.outboundCapable ? "Outbound ready" : "Inbound only",
                ].join(" · "),
                right: agent ? (
                  <Button
                    size="sm" variant="outline" disabled={busy}
                    onClick={() => run(`${n.number} assigned to ${agent.name}.`, () => voiceOps.assignNumber(agent.id, n.id))}
                  >
                    Assign
                  </Button>
                ) : (
                  <Badge variant="secondary">{n.assistantId ? "Assigned" : "Available"}</Badge>
                ),
              }))}
            />
          )}

          {connectNumberPanel}
        </CardShell>
      );
    }


    case "campaign_form": {
      if (!agents.length) return null;
      const selected = agents.find((a) => a.id === campaignAgent) ?? agents[0];
      return (
        <CardShell icon={PhoneOutgoing} title="Outbound campaign">
          <div>
            <Label className="text-xs">Agent</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {agents.map((a) => (
                <Button
                  key={a.id} size="sm" variant={selected?.id === a.id ? "default" : "outline"}
                  onClick={() => setCampaignAgent(a.id)}
                >
                  {a.name}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Objective</Label>
            <Input
              value={callPurpose} onChange={(e) => setCallPurpose(e.target.value)}
              placeholder="Follow up with last week's enquiries" className="rounded-lg"
            />
          </div>
          <div>
            <Label className="text-xs">Contacts ({picked.length} selected)</Label>
            {contacts.length === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                No contacts with phone numbers yet. Leads captured by your agents appear here automatically.
              </p>
            ) : (
              <ul className="mt-1 max-h-48 divide-y divide-border/60 overflow-y-auto rounded-lg border border-border/60">
                {contacts.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <Checkbox
                      id={`c-${c.id}`} checked={picked.includes(c.id)}
                      onCheckedChange={(v) =>
                        setPicked((p) => (v ? [...p, c.id] : p.filter((x) => x !== c.id)))
                      }
                    />
                    <label htmlFor={`c-${c.id}`} className="min-w-0 flex-1 cursor-pointer">
                      <span className="block truncate font-medium">{c.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{c.phone}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button
            size="sm" disabled={busy || !picked.length || !selected}
            onClick={() =>
              run(`Campaign launched to ${picked.length} contact${picked.length === 1 ? "" : "s"}.`, async () => {
                for (const id of picked) {
                  const c = contacts.find((x) => x.id === id);
                  if (!c?.phone) continue;
                  await voiceOps.placeCall({ agentId: selected.id, to: c.phone, name: c.name, purpose: callPurpose });
                }
              })
            }
          >
            {busy ? <YanguSpinner size={16} className="mr-1.5" /> : <PhoneOutgoing className="mr-1.5 h-4 w-4" />}
            Launch campaign
          </Button>
        </CardShell>
      );
    }

    default:
      return null;
  }
}

export function SkillTag({ label, className }: { label?: string | null; className?: string }) {
  if (!label) return null;
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <Bot className="h-3.5 w-3.5" />Loaded {label}
    </p>
  );
}
