import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, PhoneCall, PhoneOutgoing, MessageSquare, ArrowUp, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSendBuilderTurn } from "../data/builderHooks";

const QUICK_STARTS = [
  {
    id: "inbound",
    icon: PhoneCall,
    title: "Inbound",
    desc: "Answer calls, greet customers, take messages.",
    seed: "I want an inbound voice agent that answers calls, greets customers and takes messages.",
  },
  {
    id: "outbound",
    icon: PhoneOutgoing,
    title: "Outbound",
    desc: "Sales calls, follow-ups, appointment reminders.",
    seed: "I want an outbound voice agent for sales calls, follow-ups and appointment reminders.",
  },
  {
    id: "support",
    icon: MessageSquare,
    title: "Support",
    desc: "Customer support, troubleshooting and routing.",
    seed: "I want a customer support agent that troubleshoots issues and routes callers to the right team.",
  },
];

export default function CreateAgentPage() {
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const turn = useSendBuilderTurn();

  async function start(seed: string) {
    const value = seed.trim();
    if (!value || turn.isPending) return;
    try {
      const result = await turn.mutateAsync({ text: value });
      navigate(`/dashboard/agents/build/${result.threadId}`);
    } catch (e) {
      toast({
        title: "Couldn't start the builder",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center py-8 sm:py-14">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_40px_-12px_hsl(var(--primary))]">
        <Bot className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">Create an Agent</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Choose a type to get started, or just describe what you need.
      </p>

      <div className="mt-7 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        {QUICK_STARTS.map((q) => (
          <Card
            key={q.id}
            role="button"
            tabIndex={0}
            aria-label={`Start ${q.title} agent`}
            onClick={() => start(q.seed)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") start(q.seed); }}
            className="cursor-pointer transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none"
          >
            <CardContent className="p-5">
              <q.icon className="h-6 w-6 text-primary" />
              <p className="mt-3 font-semibold">{q.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{q.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">Or describe what you want to build</p>
      <div className="relative mt-3 w-full">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); start(text); }
          }}
          placeholder="Build a bilingual receptionist"
          rows={3}
          autoFocus
          className="min-h-[88px] resize-none rounded-lg pr-14 text-base"
        />
        <Button
          size="icon"
          aria-label="Start building"
          disabled={!text.trim() || turn.isPending}
          onClick={() => start(text)}
          className="absolute bottom-3 right-3 h-10 w-10 rounded-lg"
        >
          {turn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
        </Button>
      </div>
      {turn.isPending && (
        <p className="mt-3 text-xs text-muted-foreground">Loading Agent Builder…</p>
      )}
    </div>
  );
}
