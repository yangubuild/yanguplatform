import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles } from "lucide-react";
import { db } from "../data/mock";
import { PageHeader } from "../components/PageHeader";

const SUGGESTIONS = ["How many leads this week?", "What's Amara's handover rate?", "Which channel is converting best?", "Book a demo for Miriam Osei."];

function respond(q: string): string {
  const k = db.kpis();
  if (/leads/i.test(q)) return `You have ${k.leadsThisWeek} leads this week (${k.leadsDelta}).`;
  if (/handover/i.test(q)) { const a = db.agents.list().find(x=>/amara/i.test(q))?.handoverRate ?? k.handoverRate; return `Handover rate is ${a}%.`; }
  if (/channel/i.test(q)) return `WhatsApp is your top channel — 48% of conversations.`;
  if (/book|demo/i.test(q)) return `Done — I've booked a demo and notified Amara.`;
  return `${k.conversationsToday} conversations, ${k.leadsThisWeek} leads, ${k.appointmentsBooked} appointments — all trending up.`;
}

export default function AssistantPage() {
  const [msgs, setMsgs] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "I'm your business assistant. Ask me anything about your pipeline, agents or workflows." },
  ]);
  const [input, setInput] = useState("");

  const ask = (q: string) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "ai", text: respond(q) }]);
    setInput("");
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <PageHeader title="Assistant" description="Talk to your business." />
      <Card className="p-4 h-[540px] flex flex-col">
        <div className="flex-1 overflow-auto space-y-3">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : ""}>
              <div className={"inline-block max-w-[80%] rounded-lg px-3 py-2 text-sm " + (m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                {m.role === "ai" && <Sparkles className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />}
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-3">
          {SUGGESTIONS.map((s) => <Button key={s} size="sm" variant="outline" onClick={() => ask(s)}>{s}</Button>)}
        </div>
        <div className="flex gap-2 pt-3">
          <Input placeholder="Ask about your business…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask(input)} />
          <Button onClick={() => ask(input)}><Send className="h-4 w-4" /></Button>
        </div>
      </Card>
    </div>
  );
}