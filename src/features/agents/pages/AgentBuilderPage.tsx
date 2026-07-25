import { useParams, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  ArrowLeft, Bot, Play, Rocket, Save, Plus, Trash2, Upload, CheckCircle2, AlertCircle, Copy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { db } from "../data/mock";
import { useAgent, useAgentConfig, useSaveAgentConfig, usePublishAgentConfig, useUpdateAgent, useDeleteAgent, useAgents } from "../data/hooks";
import { Loader2 } from "lucide-react";
import { route as routeMessage, TEST_SCENARIOS } from "../data/conversationDb";
import type {
  AgentConfig, AgentCommand, QualificationQuestion, HandoverRule, Channel,
} from "../data/types";
import { StatusDot } from "../components/PageHeader";
import { toast } from "@/hooks/use-toast";

const TABS = [
  "overview","personality","voice","knowledge","actions","channels",
  "workflows","handover","testing","analytics","settings","deploy",
] as const;

const LANGUAGES = ["English","Swahili","French","Arabic","Portuguese","Amharic","Hausa","Yoruba","Zulu"];
const ACCENTS = ["East African","West African","Southern African","North African","British","American","Neutral"];
const VOICE_PROVIDERS = [
  { id: "elevenlabs", label: "ElevenLabs" },
  { id: "openai",     label: "OpenAI TTS" },
  { id: "google",     label: "Google Cloud TTS" },
  { id: "azure",      label: "Azure Neural" },
  { id: "polly",      label: "Amazon Polly" },
  { id: "coqui",      label: "Coqui" },
];
const VOICE_PRESETS = [
  "Warm Female — Nairobi", "Professional Male — EA", "Neutral Female — Global",
  "Confident Male — Lagos", "Friendly Female — Accra", "Calm Male — Cairo",
];
const DEPARTMENTS: { id: AgentConfig["department"]; label: string }[] = [
  { id: "sales", label: "Sales" },
  { id: "customer_support", label: "Customer Support" },
  { id: "reception", label: "Reception" },
  { id: "operations", label: "Operations" },
  { id: "hr", label: "HR" },
  { id: "finance", label: "Finance" },
  { id: "marketing", label: "Marketing" },
  { id: "it", label: "IT" },
  { id: "logistics", label: "Logistics" },
  { id: "custom", label: "Custom" },
];
const TONE_STYLES: AgentConfig["toneStyle"][] = [
  "warm","professional","friendly","playful","direct","empathetic",
];
const ACTION_CATALOG: { id: string; label: string; description: string }[] = [
  { id: "book_appointment", label: "Book appointment", description: "Create a calendar booking." },
  { id: "send_email",       label: "Send email",       description: "Compose and send emails." },
  { id: "send_sms",         label: "Send SMS",         description: "Send SMS notifications." },
  { id: "create_lead",      label: "Create lead",      description: "Add a new lead to the CRM." },
  { id: "update_crm",       label: "Update CRM",       description: "Update contact / deal records." },
  { id: "take_payment",     label: "Take payment",     description: "Charge cards or take deposits." },
  { id: "send_invoice",     label: "Send invoice",     description: "Generate and send invoices." },
  { id: "refund",           label: "Issue refund",     description: "Process refunds (requires approval)." },
  { id: "transfer_call",    label: "Transfer call",    description: "Warm-transfer voice calls." },
  { id: "escalate_human",   label: "Escalate to human",description: "Route to the correct human queue." },
  { id: "tag_contact",      label: "Tag contact",      description: "Apply tags for segmentation." },
  { id: "schedule_followup",label: "Schedule follow-up",description: "Queue an outbound follow-up." },
];
const CHANNEL_META: { id: Channel; label: string; hint: string }[] = [
  { id: "whatsapp",  label: "WhatsApp",   hint: "Requires WhatsApp Business number." },
  { id: "web",       label: "Web widget", hint: "Embed on your website." },
  { id: "voice",     label: "Voice",      hint: "Inbound / outbound phone." },
  { id: "instagram", label: "Instagram",  hint: "Reply to Instagram DMs." },
  { id: "email",     label: "Email",      hint: "Handle inbound support email." },
  { id: "sms",       label: "SMS",        hint: "Two-way SMS conversations." },
];

function validate(cfg: AgentConfig): string[] {
  const errs: string[] = [];
  if (!cfg.name.trim()) errs.push("Employee name is required.");
  if (cfg.name.length > 60) errs.push("Employee name must be 60 characters or less.");
  if (!cfg.role.trim()) errs.push("Role is required.");
  if (!cfg.greeting.trim()) errs.push("Greeting is required.");
  if (!cfg.language) errs.push("Primary language is required.");
  if (cfg.voiceEnabled && !cfg.voiceId) errs.push("Voice is enabled but no voice is selected.");
  if (cfg.similarityThreshold < 0 || cfg.similarityThreshold > 1) errs.push("Similarity threshold must be between 0 and 1.");
  if (cfg.topK < 1 || cfg.topK > 20) errs.push("Top-K must be between 1 and 20.");
  if (cfg.rateLimitPerMin < 1) errs.push("Rate limit must be at least 1.");
  const hasChannel = Object.values(cfg.channels).some(c => c.enabled);
  if (!hasChannel) errs.push("Enable at least one channel.");
  return errs;
}

export default function AgentBuilderPage() {
  const { id } = useParams();
  const { data: allAgents = [] } = useAgents();
  const { data: liveAgent } = useAgent(id);
  const agent = liveAgent ?? allAgents[0] ?? db.agents.get(id ?? "") ?? db.agents.list()[0];
  const { data: remoteCfg, isLoading: cfgLoading } = useAgentConfig(agent?.id, "draft");
  const [cfg, setCfg] = useState<AgentConfig | null>(null);
  const [dirty, setDirty] = useState(false);
  const saveMut = useSaveAgentConfig();
  const publishMut = usePublishAgentConfig();
  const updateAgentMut = useUpdateAgent();
  const deleteAgentMut = useDeleteAgent();

  // Hydrate local editor state whenever the remote config resolves (or mock fallback).
  useMemo(() => {
    if (remoteCfg && !dirty) setCfg(remoteCfg);
  }, [remoteCfg?.id, remoteCfg?.version]);
  const errors = useMemo(() => (cfg ? validate(cfg) : ["Loading configuration…"]), [cfg]);
  const saving = saveMut.isPending || publishMut.isPending;

  if (!cfg || cfgLoading) {
    return (
      <div className="flex items-center gap-2 p-12 text-sm text-muted-foreground justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />Loading agent configuration…
      </div>
    );
  }

  function update<K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) {
    setCfg((c) => (c ? { ...c, [key]: value } : c));
    setDirty(true);
  }

  function handleSave() {
    if (errors.length) {
      toast({ title: "Fix validation errors", description: errors[0], variant: "destructive" });
      return;
    }
    if (!cfg) return;
    saveMut.mutate(
      { agentId: cfg.agentId, config: cfg },
      {
        onSuccess: (next) => { setCfg(next); setDirty(false); },
      },
    );
  }

  function handlePublish(env: "draft" | "staging" | "live") {
    if (env === "live" && errors.length) {
      toast({ title: "Cannot publish", description: errors[0], variant: "destructive" });
      return;
    }
    if (!cfg) return;
    publishMut.mutate({ agentId: cfg.agentId, env }, {
      onSuccess: (next) => { setCfg(next); setDirty(false); },
    });
    // Mirror status onto the agent so lists reflect the environment.
    updateAgentMut.mutate({ id: cfg.agentId, patch: { status: env === "live" ? "live" : env === "staging" ? "paused" : "draft" } });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm"><Link to="/dashboard/agents/agents"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link></Button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center overflow-hidden">
            {cfg.avatarUrl ? <img src={cfg.avatarUrl} alt={cfg.name} className="h-full w-full object-cover" /> : <Bot className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{cfg.role} · {DEPARTMENTS.find(d=>d.id===cfg.department)?.label}</p>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{cfg.name}</h2>
              <StatusDot status={agent.status} />
              <Badge variant="secondary" className="capitalize">{cfg.environment}</Badge>
              <Badge variant="outline">v{cfg.version}</Badge>
              <Badge variant="outline">{cfg.language}{cfg.secondaryLanguages.length ? ` +${cfg.secondaryLanguages.length}` : ""}</Badge>
              {dirty && <Badge variant="outline" className="text-amber-600 border-amber-500/40">Unsaved</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{cfg.personaDescription}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={!dirty || saving}>
            <Save className="h-4 w-4 mr-1.5" />{saving ? "Saving…" : "Save"}
          </Button>
          <Button variant="outline"><Play className="h-4 w-4 mr-1.5" />Test</Button>
          <Button onClick={() => handlePublish("live")} disabled={errors.length > 0}>
            <Rocket className="h-4 w-4 mr-1.5" />Publish
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">{errors.length} item{errors.length>1?"s":""} to fix before publishing</p>
              <ul className="list-disc pl-5 mt-1 text-muted-foreground">
                {errors.slice(0,4).map((e) => <li key={e}>{e}</li>)}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap h-auto">
          {TABS.map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>)}
        </TabsList>

        {/* ─── OVERVIEW ─── */}
        <TabsContent value="overview" className="mt-5 space-y-4">
          <Card><CardContent className="p-5 space-y-4">
            <SectionTitle title="Employee identity" hint="How this AI employee is introduced to your customers and team." />
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                {cfg.avatarUrl ? <img src={cfg.avatarUrl} alt="" className="h-full w-full object-cover" /> : <Bot className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => update("avatarUrl", `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(cfg.name)}`)}>
                  <Upload className="h-4 w-4 mr-1.5" />Set avatar
                </Button>
                {cfg.avatarUrl && <Button variant="ghost" size="sm" onClick={() => update("avatarUrl", undefined)}>Remove</Button>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Employee name" required>
                <Input value={cfg.name} onChange={(e) => update("name", e.target.value)} maxLength={60} />
              </Field>
              <Field label="Role / title" required>
                <Input value={cfg.role} onChange={(e) => update("role", e.target.value)} placeholder="e.g. Senior Sales Representative" />
              </Field>
              <Field label="Department">
                <Select value={cfg.department} onValueChange={(v) => update("department", v as AgentConfig["department"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Reports to">
                <Input placeholder="e.g. Head of Sales" />
              </Field>
            </div>
          </CardContent></Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { l: "Conversations today", v: agent.conversationsToday },
              { l: "Leads this week", v: agent.leadsThisWeek },
              { l: "Handover rate", v: `${agent.handoverRate}%` },
            ].map((k) => (
              <Card key={k.l}><CardContent className="p-5"><div className="text-2xl font-semibold">{k.v}</div><p className="text-xs text-muted-foreground mt-1">{k.l}</p></CardContent></Card>
            ))}
          </div>

          <Card className="border-destructive/40">
            <CardContent className="p-5 flex items-center justify-between">
              <div><p className="font-semibold text-sm">Danger zone</p><p className="text-xs text-muted-foreground">Archive or delete this AI employee.</p></div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePublish("draft")}>Move to draft</Button>
                <Button variant="outline" size="sm">Archive</Button>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── PERSONALITY ─── */}
        <TabsContent value="personality" className="mt-5 space-y-4">
          <Card><CardContent className="p-5 space-y-5">
            <SectionTitle title="Persona" hint="How your AI employee sounds and behaves in conversation." />
            <Field label="Persona description" required>
              <Textarea rows={3} value={cfg.personaDescription} onChange={(e) => update("personaDescription", e.target.value)} />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Tone style">
                <Select value={cfg.toneStyle} onValueChange={(v) => update("toneStyle", v as AgentConfig["toneStyle"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TONE_STYLES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Greeting message" required>
                <Input value={cfg.greeting} onChange={(e) => update("greeting", e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SliderField label="Formal ↔ Casual" value={cfg.formalCasual} onChange={(v) => update("formalCasual", v)} />
              <SliderField label="Concise ↔ Detailed" value={cfg.conciseDetailed} onChange={(v) => update("conciseDetailed", v)} />
              <SliderField label="Warm ↔ Direct" value={cfg.warmDirect} onChange={(v) => update("warmDirect", v)} />
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Do say" hint="Behaviours to always follow.">
                <Textarea rows={4} value={cfg.doSay} onChange={(e) => update("doSay", e.target.value)} />
              </Field>
              <Field label="Don't say" hint="Behaviours to always avoid.">
                <Textarea rows={4} value={cfg.dontSay} onChange={(e) => update("dontSay", e.target.value)} />
              </Field>
            </div>
            <Field label="Sample greetings" hint="One per line — used to seed conversations.">
              <Textarea rows={3} value={cfg.sampleGreetings} onChange={(e) => update("sampleGreetings", e.target.value)} />
            </Field>
          </CardContent></Card>
        </TabsContent>

        {/* ─── VOICE ─── */}
        <TabsContent value="voice" className="mt-5 space-y-4">
          <Card><CardContent className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Voice</p>
                <p className="text-xs text-muted-foreground">Enable phone and voice channels for this AI employee.</p>
              </div>
              <Switch checked={cfg.voiceEnabled} onCheckedChange={(v) => update("voiceEnabled", v)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Voice provider">
                <Select value={cfg.voiceProvider} onValueChange={(v) => update("voiceProvider", v as AgentConfig["voiceProvider"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VOICE_PROVIDERS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Voice">
                <Select value={cfg.voiceId} onValueChange={(v) => update("voiceId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select a voice" /></SelectTrigger>
                  <SelectContent>{VOICE_PRESETS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Gender">
                <Select value={cfg.gender} onValueChange={(v) => update("gender", v as AgentConfig["gender"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Primary language" required>
                <Select value={cfg.language} onValueChange={(v) => update("language", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Regional accent">
                <Select value={cfg.regionalAccent} onValueChange={(v) => update("regionalAccent", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ACCENTS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Phone number">
                <Input placeholder="+254 20 000 0000" value={cfg.phoneNumber ?? ""} onChange={(e) => update("phoneNumber", e.target.value)} />
              </Field>
            </div>
            <Field label="Secondary languages" hint="Comma separated.">
              <Input value={cfg.secondaryLanguages.join(", ")} onChange={(e) => update("secondaryLanguages", e.target.value.split(",").map(s=>s.trim()).filter(Boolean))} />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SliderField label={`Speaking speed (${(cfg.speakingSpeed/100).toFixed(2)}x)`} value={cfg.speakingSpeed} min={50} max={200} onChange={(v) => update("speakingSpeed", v)} />
              <SliderField label="Pitch" value={cfg.pitch} onChange={(v) => update("pitch", v)} />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Natural filler words</Label><p className="text-xs text-muted-foreground">Add "um / ah" for a more human feel.</p></div>
              <Switch checked={cfg.fillerWords} onCheckedChange={(v) => update("fillerWords", v)} />
            </div>
            <Button variant="outline"><Play className="h-4 w-4 mr-1.5" />Preview voice</Button>
          </CardContent></Card>
        </TabsContent>

        {/* ─── KNOWLEDGE ─── */}
        <TabsContent value="knowledge" className="mt-5 space-y-4">
          <Card><CardContent className="p-5 space-y-4">
            <SectionTitle title="Company knowledge" hint="What this employee knows about your business." />
            <Field label="Company knowledge">
              <Textarea rows={4} value={cfg.companyKnowledge} onChange={(e) => update("companyKnowledge", e.target.value)} />
            </Field>
            <Field label="Company instructions" hint="Rules and preferences that shape every response.">
              <Textarea rows={4} value={cfg.companyInstructions} onChange={(e) => update("companyInstructions", e.target.value)} />
            </Field>
            <Field label="Business rules" hint="Hard rules the employee must never break.">
              <Textarea rows={4} value={cfg.businessRules} onChange={(e) => update("businessRules", e.target.value)} />
            </Field>
            <Field label="Business goals" hint="What this employee is optimising for.">
              <Textarea rows={3} value={cfg.businessGoals} onChange={(e) => update("businessGoals", e.target.value)} />
            </Field>
          </CardContent></Card>

          <Card><CardContent className="p-5 space-y-3">
            <SectionTitle title="Knowledge sources" hint="Attach documents, URLs, and FAQs for retrieval." />
            {db.knowledge.list().map((k) => {
              const attached = cfg.attachedKnowledgeIds.includes(k.id);
              return (
                <div key={k.id} className="flex items-center justify-between border-b border-border last:border-0 pb-3 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{k.title}</p>
                    <p className="text-xs text-muted-foreground">{k.type} · {k.size} · {k.status}</p>
                  </div>
                  <Switch checked={attached} onCheckedChange={(v) => {
                    const next = v ? [...cfg.attachedKnowledgeIds, k.id] : cfg.attachedKnowledgeIds.filter(x => x !== k.id);
                    update("attachedKnowledgeIds", next);
                  }} />
                </div>
              );
            })}
            <Button asChild variant="outline" className="w-full"><Link to="/dashboard/agents/knowledge"><Plus className="h-4 w-4 mr-1.5" />Manage sources</Link></Button>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Top-K">
                <Input type="number" min={1} max={20} value={cfg.topK} onChange={(e) => update("topK", Number(e.target.value))} />
              </Field>
              <Field label="Similarity threshold">
                <Input type="number" min={0} max={1} step={0.05} value={cfg.similarityThreshold} onChange={(e) => update("similarityThreshold", Number(e.target.value))} />
              </Field>
              <Field label="Memory retention (days)">
                <Input type="number" min={0} max={3650} value={cfg.memoryRetentionDays} onChange={(e) => update("memoryRetentionDays", Number(e.target.value))} />
              </Field>
            </div>
            <Field label="Fallback answer" hint="Shown when confidence is below threshold.">
              <Textarea rows={2} value={cfg.fallbackAnswer} onChange={(e) => update("fallbackAnswer", e.target.value)} />
            </Field>
          </CardContent></Card>
        </TabsContent>

        {/* ─── ACTIONS ─── */}
        <TabsContent value="actions" className="mt-5 space-y-4">
          <Card><CardContent className="p-5 space-y-3">
            <SectionTitle title="Allowed actions" hint="What this employee is permitted to do on your behalf." />
            {ACTION_CATALOG.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
                <Switch
                  checked={!!cfg.allowedActions[a.id]}
                  onCheckedChange={(v) => update("allowedActions", { ...cfg.allowedActions, [a.id]: v })}
                />
              </div>
            ))}
          </CardContent></Card>

          <Card><CardContent className="p-5 space-y-3">
            <SectionTitle title="Commands" hint="Trigger phrases that force specific behaviours." />
            {cfg.commands.map((c, i) => (
              <div key={c.id} className="grid grid-cols-12 gap-2 items-start">
                <Input className="col-span-3" value={c.trigger} onChange={(e) => {
                  const next = [...cfg.commands]; next[i] = { ...c, trigger: e.target.value }; update("commands", next);
                }} placeholder="/trigger" />
                <Input className="col-span-7" value={c.response} onChange={(e) => {
                  const next = [...cfg.commands]; next[i] = { ...c, response: e.target.value }; update("commands", next);
                }} placeholder="What the AI should do…" />
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <Switch checked={c.enabled} onCheckedChange={(v) => {
                    const next = [...cfg.commands]; next[i] = { ...c, enabled: v }; update("commands", next);
                  }} />
                  <Button variant="ghost" size="icon" onClick={() => update("commands", cfg.commands.filter(x => x.id !== c.id))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => update("commands", [...cfg.commands, { id: `cmd-${Date.now()}`, trigger: "/new", response: "", enabled: true } as AgentCommand])}>
              <Plus className="h-4 w-4 mr-1.5" />Add command
            </Button>
          </CardContent></Card>

          <Card><CardContent className="p-5 space-y-3">
            <SectionTitle title="Qualification questions" hint="Questions the AI asks before handing off a qualified lead." />
            {cfg.qualificationQuestions.map((q, i) => (
              <div key={q.id} className="grid grid-cols-12 gap-2 items-start">
                <Input className="col-span-6" value={q.question} onChange={(e) => {
                  const next = [...cfg.qualificationQuestions]; next[i] = { ...q, question: e.target.value }; update("qualificationQuestions", next);
                }} />
                <Select value={q.type} onValueChange={(v) => {
                  const next = [...cfg.qualificationQuestions]; next[i] = { ...q, type: v as QualificationQuestion["type"] }; update("qualificationQuestions", next);
                }}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="choice">Choice</SelectItem>
                    <SelectItem value="budget">Budget</SelectItem>
                  </SelectContent>
                </Select>
                <div className="col-span-3 flex items-center justify-end gap-2">
                  <div className="flex items-center gap-1 text-xs"><Switch checked={q.required} onCheckedChange={(v) => {
                    const next = [...cfg.qualificationQuestions]; next[i] = { ...q, required: v }; update("qualificationQuestions", next);
                  }} /><span>Required</span></div>
                  <Button variant="ghost" size="icon" onClick={() => update("qualificationQuestions", cfg.qualificationQuestions.filter(x => x.id !== q.id))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => update("qualificationQuestions", [...cfg.qualificationQuestions, { id: `q-${Date.now()}`, question: "", required: false, type: "text" }])}>
              <Plus className="h-4 w-4 mr-1.5" />Add question
            </Button>
          </CardContent></Card>
        </TabsContent>

        {/* ─── CHANNELS ─── */}
        <TabsContent value="channels" className="mt-5 space-y-4">
          <Card><CardContent className="p-5 space-y-3">
            <SectionTitle title="Channels" hint="Where this employee talks to customers." />
            {CHANNEL_META.map((c) => {
              const state = cfg.channels[c.id];
              return (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.hint} {state?.enabled && <span className="inline-flex items-center gap-1 ml-2 text-emerald-600"><CheckCircle2 className="h-3 w-3" />Enabled</span>}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={!!state?.enabled} onCheckedChange={(v) => update("channels", { ...cfg.channels, [c.id]: { ...state, enabled: v } })} />
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              );
            })}
          </CardContent></Card>
          <Card><CardContent className="p-5 space-y-3">
            <SectionTitle title="Web widget" />
            <Field label="Widget theme">
              <Select value={cfg.webWidgetTheme} onValueChange={(v) => update("webWidgetTheme", v as AgentConfig["webWidgetTheme"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Embed script">
              <Textarea rows={3} readOnly value={`<script src="https://yangu.io/agents/embed.js" data-agent="${agent.id}" data-theme="${cfg.webWidgetTheme}" async></script>`} />
            </Field>
            <Button variant="outline" size="sm" onClick={() => {
              navigator.clipboard?.writeText(`<script src="https://yangu.io/agents/embed.js" data-agent="${agent.id}" data-theme="${cfg.webWidgetTheme}" async></script>`);
              toast({ title: "Copied to clipboard" });
            }}><Copy className="h-4 w-4 mr-1.5" />Copy embed</Button>
          </CardContent></Card>
        </TabsContent>

        {/* ─── WORKFLOWS ─── */}
        <TabsContent value="workflows" className="mt-5 space-y-4">
          <Card><CardContent className="p-5 space-y-3">
            <SectionTitle title="Attached workflows" hint="Workflows this employee can trigger." />
            {db.workflows.list().map((w) => {
              const on = cfg.attachedWorkflowIds.includes(w.id);
              return (
                <div key={w.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{w.name}</p>
                    <p className="text-xs text-muted-foreground">{w.trigger} · {w.steps} steps · {w.runs} runs</p>
                  </div>
                  <Switch checked={on} onCheckedChange={(v) => {
                    const next = v ? [...cfg.attachedWorkflowIds, w.id] : cfg.attachedWorkflowIds.filter(x => x !== w.id);
                    update("attachedWorkflowIds", next);
                  }} />
                </div>
              );
            })}
            <Button asChild variant="outline" className="w-full"><Link to="/dashboard/agents/workflows"><Plus className="h-4 w-4 mr-1.5" />Create workflow</Link></Button>
          </CardContent></Card>
          <Card><CardContent className="p-5 space-y-3">
            <SectionTitle title="Connected integrations" hint="External tools this employee can use." />
            {db.integrations.list().map((i) => {
              const on = cfg.connectedIntegrationIds.includes(i.id);
              return (
                <div key={i.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{i.name} <span className="text-xs text-muted-foreground capitalize">· {i.category}</span></p>
                    <p className="text-xs text-muted-foreground">{i.description}</p>
                  </div>
                  <Switch checked={on} disabled={!i.connected} onCheckedChange={(v) => {
                    const next = v ? [...cfg.connectedIntegrationIds, i.id] : cfg.connectedIntegrationIds.filter(x => x !== i.id);
                    update("connectedIntegrationIds", next);
                  }} />
                </div>
              );
            })}
          </CardContent></Card>
        </TabsContent>

        {/* ─── HANDOVER ─── */}
        <TabsContent value="handover" className="mt-5 space-y-4">
          <Card><CardContent className="p-5 space-y-3">
            <SectionTitle title="Human handover rules" hint="When the AI should hand the conversation to a human." />
            {cfg.handoverRules.map((r, i) => (
              <div key={r.id} className="grid grid-cols-12 gap-2 items-center border-b border-border last:border-0 pb-3 last:pb-0">
                <Input className="col-span-5" value={r.trigger} onChange={(e) => {
                  const next = [...cfg.handoverRules]; next[i] = { ...r, trigger: e.target.value }; update("handoverRules", next);
                }} />
                <Select value={r.route} onValueChange={(v) => {
                  const next = [...cfg.handoverRules]; next[i] = { ...r, route: v as HandoverRule["route"] }; update("handoverRules", next);
                }}>
                  <SelectTrigger className="col-span-5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support_queue">Support queue</SelectItem>
                    <SelectItem value="sales_queue">Sales queue</SelectItem>
                    <SelectItem value="owner">Business owner</SelectItem>
                    <SelectItem value="custom">Custom target</SelectItem>
                  </SelectContent>
                </Select>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <Switch checked={r.enabled} onCheckedChange={(v) => {
                    const next = [...cfg.handoverRules]; next[i] = { ...r, enabled: v }; update("handoverRules", next);
                  }} />
                  <Button variant="ghost" size="icon" onClick={() => update("handoverRules", cfg.handoverRules.filter(x => x.id !== r.id))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => update("handoverRules", [...cfg.handoverRules, { id: `h-${Date.now()}`, trigger: "New trigger", enabled: true, route: "support_queue" }])}>
              <Plus className="h-4 w-4 mr-1.5" />Add rule
            </Button>
          </CardContent></Card>
          <Card><CardContent className="p-5 space-y-4">
            <SectionTitle title="Routing & confidence" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Business hours route">
                <Input value={cfg.businessHoursRoute} onChange={(e) => update("businessHoursRoute", e.target.value)} />
              </Field>
              <Field label="After hours route">
                <Input value={cfg.afterHoursRoute} onChange={(e) => update("afterHoursRoute", e.target.value)} />
              </Field>
              <Field label="Notify channel">
                <Input value={cfg.notifyChannel} onChange={(e) => update("notifyChannel", e.target.value)} />
              </Field>
              <SliderField label={`Confidence threshold (${cfg.confidenceThreshold.toFixed(2)})`} value={cfg.confidenceThreshold * 100} onChange={(v) => update("confidenceThreshold", v/100)} />
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* ─── TESTING ─── */}
        <TabsContent value="testing" className="mt-5 space-y-4">
          <TestSandbox cfg={cfg} />
        </TabsContent>

        {/* ─── ANALYTICS ─── */}
        <TabsContent value="analytics" className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[["Conversations",agent.conversationsToday],["Resolution %","82"],["Avg msgs / resolve","4.1"],["CSAT","4.6/5"]].map(([l,v]) => (
            <Card key={l as string}><CardContent className="p-5"><div className="text-2xl font-semibold">{v}</div><p className="text-xs text-muted-foreground mt-1">{l}</p></CardContent></Card>
          ))}
          <Card className="md:col-span-4"><CardContent className="p-5 space-y-2">
            <SectionTitle title="Version history" />
            <p className="text-sm text-muted-foreground">v{cfg.version} · updated {new Date(cfg.updatedAt).toLocaleString()}{cfg.publishedAt && ` · published ${new Date(cfg.publishedAt).toLocaleString()}`}</p>
          </CardContent></Card>
        </TabsContent>

        {/* ─── SETTINGS ─── */}
        <TabsContent value="settings" className="mt-5 space-y-4">
          <Card><CardContent className="p-5 space-y-4">
            <SectionTitle title="Working hours" hint="When this employee should be active." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Timezone">
                <Input value={cfg.workingHours.timezone} onChange={(e) => update("workingHours", { ...cfg.workingHours, timezone: e.target.value })} />
              </Field>
              <Field label="After-hours behavior">
                <Select value={cfg.workingHours.afterHoursBehavior} onValueChange={(v) => update("workingHours", { ...cfg.workingHours, afterHoursBehavior: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="handover">Handover to human</SelectItem>
                    <SelectItem value="take_message">Take a message</SelectItem>
                    <SelectItem value="book_callback">Book a callback</SelectItem>
                    <SelectItem value="auto_reply">Auto-reply only</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="space-y-2">
              {(Object.keys(cfg.workingHours.days) as (keyof typeof cfg.workingHours.days)[]).map((day) => {
                const d = cfg.workingHours.days[day];
                return (
                  <div key={day} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-2 text-sm capitalize">{day}</div>
                    <Switch className="col-span-1" checked={d.enabled} onCheckedChange={(v) => update("workingHours", { ...cfg.workingHours, days: { ...cfg.workingHours.days, [day]: { ...d, enabled: v } } })} />
                    <Input className="col-span-4" type="time" value={d.open} disabled={!d.enabled} onChange={(e) => update("workingHours", { ...cfg.workingHours, days: { ...cfg.workingHours.days, [day]: { ...d, open: e.target.value } } })} />
                    <Input className="col-span-4" type="time" value={d.close} disabled={!d.enabled} onChange={(e) => update("workingHours", { ...cfg.workingHours, days: { ...cfg.workingHours.days, [day]: { ...d, close: e.target.value } } })} />
                  </div>
                );
              })}
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-5 space-y-4">
            <SectionTitle title="Memory" hint="How much this employee remembers between conversations." />
            <div className="flex items-center justify-between">
              <Label>Enable long-term memory</Label>
              <Switch checked={cfg.memoryEnabled} onCheckedChange={(v) => update("memoryEnabled", v)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Memory scope">
                <Select value={cfg.memoryScope} onValueChange={(v) => update("memoryScope", v as AgentConfig["memoryScope"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session">Session only</SelectItem>
                    <SelectItem value="contact">Per contact</SelectItem>
                    <SelectItem value="org">Whole organization</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Retention (days)">
                <Input type="number" min={0} value={cfg.memoryRetentionDays} onChange={(e) => update("memoryRetentionDays", Number(e.target.value))} />
              </Field>
              <Field label="Rate limit / min">
                <Input type="number" min={1} value={cfg.rateLimitPerMin} onChange={(e) => update("rateLimitPerMin", Number(e.target.value))} />
              </Field>
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-5 space-y-4">
            <SectionTitle title="Compliance & privacy" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Toggle label="PII redaction" desc="Strip emails, phones and IDs from logs." checked={cfg.piiRedaction} onChange={(v) => update("piiRedaction", v)} />
              <Toggle label="Recording consent" desc="Announce recording on voice calls." checked={cfg.recordingConsent} onChange={(v) => update("recordingConsent", v)} />
              <Toggle label="GDPR mode" desc="Enforce right-to-be-forgotten workflows." checked={cfg.gdprMode} onChange={(v) => update("gdprMode", v)} />
              <Field label="Data residency">
                <Select value={cfg.dataResidency} onValueChange={(v) => update("dataResidency", v as AgentConfig["dataResidency"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="africa">Africa</SelectItem>
                    <SelectItem value="eu">European Union</SelectItem>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="AI disclaimer" hint="Shown to customers at the start of a conversation.">
              <Input value={cfg.disclaimer} onChange={(e) => update("disclaimer", e.target.value)} />
            </Field>
          </CardContent></Card>
        </TabsContent>

        {/* ─── DEPLOY ─── */}
        <TabsContent value="deploy" className="mt-5 space-y-4">
          <Card><CardContent className="p-5 space-y-4">
            <SectionTitle title="Environments" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(["draft","staging","live"] as const).map((e) => (
                <Card key={e} className={cfg.environment === e ? "border-primary" : "cursor-pointer hover:border-primary/40"} onClick={() => handlePublish(e)}>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium capitalize">{e}</p>
                    <p className="text-xs text-muted-foreground">{cfg.environment === e ? `Active · v${cfg.version}` : "Click to move here"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Field label="Webhook URL">
              <Input readOnly value={cfg.webhookUrl} />
            </Field>
            <div className="flex items-center gap-2">
              <Button className="flex-1" onClick={() => handlePublish("live")} disabled={errors.length > 0}>
                <Rocket className="h-4 w-4 mr-1.5" />Publish new version
              </Button>
              <Button variant="outline" onClick={() => handlePublish("staging")}>Send to staging</Button>
              <Button variant="outline" onClick={() => handlePublish("draft")}>Revert to draft</Button>
            </div>
            {errors.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />Ready to publish — all checks passed.
              </div>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Helper components ───
function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
function SliderField({ label, value, onChange, min = 0, max = 100 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <Slider value={[value]} onValueChange={(v) => onChange(v[0])} min={min} max={max} step={1} />
    </div>
  );
}
function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <p className="font-semibold text-sm">{title}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}
function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function TestSandbox({ cfg }: { cfg: AgentConfig }) {
  type Trace = { input: string; decision: ReturnType<typeof routeMessage> };
  const [msgs, setMsgs] = useState<{ role: "you" | "agent"; text: string; trace?: Trace["decision"] }[]>([
    { role: "agent", text: cfg.greeting },
  ]);
  const [input, setInput] = useState("");
  const [scenarioResults, setScenarioResults] = useState<{ scenarioId: string; traces: Trace[] } | null>(null);

  function send(text?: string) {
    const you = (text ?? input).trim();
    if (!you) return;
    setMsgs((m) => [...m, { role: "you", text: you }]);
    setInput("");
    const decision = routeMessage({ agentId: cfg.agentId, channel: "web", text: you });
    setMsgs((m) => [...m, { role: "agent", text: decision.reply, trace: decision }]);
  }

  function runScenario(scenarioId: string) {
    const scenario = TEST_SCENARIOS.find((s) => s.id === scenarioId)!;
    const traces: Trace[] = scenario.messages.map((msg) => ({ input: msg, decision: routeMessage({ agentId: cfg.agentId, channel: "web", text: msg }) }));
    setScenarioResults({ scenarioId, traces });
  }

  return (
    <>
      <Card><CardContent className="p-5 space-y-3">
        <SectionTitle title="Sandbox" hint="Chat with a mock of this employee. Powered by the Conversation Engine — same pipeline used at runtime." />
        <div className="rounded-lg border border-border bg-muted/40 p-4 h-80 overflow-auto text-sm space-y-3">
          {msgs.map((m, i) => (
            <div key={i}>
              <div>
                <span className={m.role === "agent" ? "font-medium text-primary" : "font-medium"}>{m.role === "agent" ? cfg.name : "You"}:</span> {m.text}
              </div>
              {m.trace && (
                <div className="mt-1 text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                  <span>Lang: {m.trace.language}</span>
                  <span>Confidence: {Math.round(m.trace.confidence * 100)}%</span>
                  <span>Decision: {m.trace.decision}</span>
                  <span>{m.trace.latencyMs}ms</span>
                  <span>~{m.trace.tokensEstimate} tokens</span>
                  {m.trace.command && <span>Command: {m.trace.command}</span>}
                  {m.trace.action && <span>Action: {m.trace.action}</span>}
                  {m.trace.ruleApplied && <span>Rule: {m.trace.ruleApplied}</span>}
                  {m.trace.handover && <span className="text-destructive">Handover: {m.trace.handover.route}</span>}
                  {m.trace.sources.length > 0 && <span>Sources: {m.trace.sources.map((s) => s.name).slice(0, 2).join(", ")}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Try a message…" className="flex-1" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <Button onClick={() => send()}>Send</Button>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-5 space-y-3">
        <SectionTitle title="Test scenarios" hint="Run pre-built scenarios covering sales, support, complaints, multilingual and handover." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {TEST_SCENARIOS.map((s) => (
            <Button key={s.id} variant="outline" size="sm" className="justify-start" onClick={() => runScenario(s.id)}>
              <Play className="h-3.5 w-3.5 mr-1.5" />{s.label}
            </Button>
          ))}
        </div>
        {scenarioResults && (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-muted-foreground">Results — {TEST_SCENARIOS.find((s) => s.id === scenarioResults.scenarioId)?.label}</p>
            {scenarioResults.traces.map((t, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-sm"><span className="font-medium">Input:</span> {t.input}</p>
                <p className="text-sm"><span className="font-medium text-primary">Reply:</span> {t.decision.reply}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  <TraceStat label="Language" value={t.decision.language} />
                  <TraceStat label="Confidence" value={`${Math.round(t.decision.confidence * 100)}%`} />
                  <TraceStat label="Decision" value={t.decision.decision} />
                  <TraceStat label="Sentiment" value={t.decision.sentiment} />
                  <TraceStat label="Latency" value={`${t.decision.latencyMs}ms`} />
                  <TraceStat label="Tokens" value={`~${t.decision.tokensEstimate}`} />
                  <TraceStat label="Command" value={t.decision.command ?? "—"} />
                  <TraceStat label="Action" value={t.decision.action ?? "—"} />
                </div>
                {t.decision.ruleApplied && <p className="text-[11px] text-muted-foreground">Rule applied: {t.decision.ruleApplied}</p>}
                {t.decision.handover && <p className="text-[11px] text-destructive">Handover → {t.decision.handover.route} · {t.decision.handover.reason}</p>}
                {t.decision.sources.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">Sources: {t.decision.sources.map((s) => `${s.name} (${Math.round(s.score * 100)}%)`).join(" · ")}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent></Card>
    </>
  );
}

function TraceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-2 py-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-medium truncate">{value}</p>
    </div>
  );
}