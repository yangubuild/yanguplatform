import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Bot, Play, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { db } from "../data/mock";
import { PageHeader, StatusDot } from "../components/PageHeader";

const TABS = [
  "overview","personality","voice","knowledge","actions","channels",
  "workflows","handover","testing","analytics","settings","deploy",
] as const;

export default function AgentBuilderPage() {
  const { id } = useParams();
  const agent = db.agents.get(id ?? "") ?? db.agents.list()[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm"><Link to="/dashboard/agents/agents"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link></Button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Bot className="h-5 w-5" /></div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{agent.type} agent</p>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{agent.name}</h2>
              <StatusDot status={agent.status} />
              <Badge variant="secondary" className="capitalize">{agent.status}</Badge>
              <Badge variant="outline">{agent.language}</Badge>
              <Badge variant="outline">{agent.voice}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{agent.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Play className="h-4 w-4 mr-1.5" />Test in sandbox</Button>
          <Button><Rocket className="h-4 w-4 mr-1.5" />Publish</Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap h-auto">
          {TABS.map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="overview" className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { l: "Conversations today", v: agent.conversationsToday },
            { l: "Leads this week", v: agent.leadsThisWeek },
            { l: "Handover rate", v: `${agent.handoverRate}%` },
          ].map((k) => (
            <Card key={k.l}><CardContent className="p-5"><div className="text-2xl font-semibold">{k.v}</div><p className="text-xs text-muted-foreground mt-1">{k.l}</p></CardContent></Card>
          ))}
          <Card className="md:col-span-3 border-destructive/40">
            <CardContent className="p-5 flex items-center justify-between">
              <div><p className="font-semibold text-sm">Danger zone</p><p className="text-xs text-muted-foreground">Archive or delete this agent.</p></div>
              <div className="flex gap-2"><Button variant="outline" size="sm">Archive</Button><Button variant="destructive" size="sm">Delete</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personality" className="mt-5 space-y-4">
          <Card><CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Name</Label><Input defaultValue={agent.name} /></div>
              <div><Label>Role</Label><Input defaultValue={`${agent.type} agent`} /></div>
            </div>
            <div><Label>Persona description</Label><Textarea rows={3} defaultValue={agent.description} /></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ToneSlider label="Formal ↔ Casual" /><ToneSlider label="Concise ↔ Detailed" /><ToneSlider label="Warm ↔ Direct" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Do say</Label><Textarea rows={3} placeholder="Always confirm the customer's name…" /></div>
              <div><Label>Don't say</Label><Textarea rows={3} placeholder="Never make refund promises…" /></div>
            </div>
            <div><Label>Sample greetings</Label><Textarea rows={3} placeholder="One per line" /></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="voice" className="mt-5 space-y-4">
          <Card><CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between"><Label>Enable voice</Label><Switch defaultChecked /></div>
            <div><Label>Voice preset</Label><Input defaultValue={agent.voice} /></div>
            <ToneSlider label="Speed" /><ToneSlider label="Pitch" />
            <div className="flex items-center justify-between"><Label>Filler words</Label><Switch /></div>
            <div><Label>Phone number</Label><Input placeholder="+254 20 000 0000" /></div>
            <Button variant="outline"><Play className="h-4 w-4 mr-1.5" />Test voice</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="knowledge" className="mt-5">
          <Card><CardContent className="p-5 space-y-3">
            {db.knowledge.list().map((k) => (
              <div key={k.id} className="flex items-center justify-between border-b border-border last:border-0 pb-3 last:pb-0">
                <div><p className="font-medium text-sm">{k.title}</p><p className="text-xs text-muted-foreground">{k.type} · {k.size}</p></div>
                <Switch defaultChecked={k.agents.includes(agent.id)} />
              </div>
            ))}
            <Button variant="outline" className="w-full">Attach source</Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
              <div><Label>Top-K</Label><Input type="number" defaultValue={5} /></div>
              <div><Label>Similarity threshold</Label><Input type="number" step="0.1" defaultValue={0.7} /></div>
            </div>
            <div><Label>Fallback answer</Label><Textarea rows={2} defaultValue="Let me connect you with a teammate." /></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="actions" className="mt-5">
          <Card><CardContent className="p-5 space-y-3">
            {["Book appointment","Send email","Send SMS","Create lead","Update CRM","Take payment","Transfer call","Escalate to human"].map((t) => (
              <div key={t} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm">{t}</span><Switch defaultChecked />
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="channels" className="mt-5">
          <Card><CardContent className="p-5 space-y-3">
            {(["whatsapp","web","voice","instagram","email","sms"] as const).map((c) => (
              <div key={c} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div><p className="text-sm capitalize font-medium">{c}</p><p className="text-xs text-muted-foreground">{agent.channels.includes(c) ? "Connected" : "Not connected"}</p></div>
                <div className="flex items-center gap-3"><Switch defaultChecked={agent.channels.includes(c)} /><Button variant="outline" size="sm">Configure</Button></div>
              </div>
            ))}
            <div className="pt-3"><Label>Web widget embed</Label><Textarea rows={3} readOnly value={`<script src="https://yangu.io/agents/embed.js" data-agent="${agent.id}" async></script>`} /></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="workflows" className="mt-5">
          <Card><CardContent className="p-5 space-y-3">
            {db.workflows.list().map((w) => (
              <div key={w.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div><p className="text-sm font-medium">{w.name}</p><p className="text-xs text-muted-foreground">{w.trigger}</p></div>
                <Switch />
              </div>
            ))}
            <Button asChild variant="outline" className="w-full"><Link to="/dashboard/agents/workflows">Create workflow</Link></Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="handover" className="mt-5">
          <Card><CardContent className="p-5 space-y-3">
            {["Frustration detected","Explicit request","Low confidence","Off-topic","Custom intent"].map((t) => (
              <div key={t} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm">{t}</span><Switch defaultChecked={t !== "Custom intent"} />
              </div>
            ))}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
              <div><Label>Business hours route</Label><Input defaultValue="Human queue: Support" /></div>
              <div><Label>After hours route</Label><Input defaultValue="Callback within 2 hours" /></div>
              <div><Label>Notify channel</Label><Input defaultValue="Slack #support" /></div>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="testing" className="mt-5">
          <Card><CardContent className="p-5 space-y-3">
            <div className="rounded-lg border border-border bg-muted/40 p-4 h-56 overflow-auto text-sm space-y-2">
              <div><span className="font-medium">You:</span> Do you deliver to Kisumu?</div>
              <div><span className="font-medium text-primary">{agent.name}:</span> Yes — 2 to 3 days, KES 450 flat.</div>
            </div>
            <div className="flex gap-2"><Input placeholder="Try a message…" className="flex-1" /><Button>Send</Button></div>
            <Button variant="outline" className="w-full">Run test suite</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[["Conversations",agent.conversationsToday],["Resolution %","82"],["Avg msgs / resolve","4.1"],["CSAT","4.6/5"]].map(([l,v]) => (
            <Card key={l as string}><CardContent className="p-5"><div className="text-2xl font-semibold">{v}</div><p className="text-xs text-muted-foreground mt-1">{l}</p></CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="settings" className="mt-5">
          <Card><CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Rename</Label><Input defaultValue={agent.name} /></div>
              <div><Label>Timezone</Label><Input defaultValue="Africa/Nairobi" /></div>
              <div><Label>Rate limit / min</Label><Input type="number" defaultValue={60} /></div>
              <div><Label>Working hours</Label><Input defaultValue="Mon–Fri, 8:00 – 18:00" /></div>
            </div>
            <div className="flex items-center justify-between"><Label>PII redaction</Label><Switch defaultChecked /></div>
            <Button variant="destructive" size="sm">Delete agent</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="deploy" className="mt-5">
          <Card><CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {["draft","staging","live"].map((e) => (
                <Card key={e} className={agent.status === e ? "border-primary" : ""}><CardContent className="p-4"><p className="text-sm font-medium capitalize">{e}</p><p className="text-xs text-muted-foreground">{agent.status === e ? "Active" : "—"}</p></CardContent></Card>
              ))}
            </div>
            <div><Label>Webhook URL</Label><Input readOnly defaultValue={`https://yangu.io/api/agents/${agent.id}/webhook`} /></div>
            <Button className="w-full"><Rocket className="h-4 w-4 mr-1.5" />Publish new version</Button>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ToneSlider({ label }: { label: string }) {
  const [v, setV] = useState([50]);
  return (
    <div><Label className="mb-2 block">{label}</Label><Slider value={v} onValueChange={setV} max={100} step={1} /></div>
  );
}