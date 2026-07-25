import { useEffect, useState } from "react";
import { Mic, PhoneOff, Volume2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { db } from "./data/mock";

const STATES = ["Listening…", "Thinking…", "Speaking…"];

export function VoiceOrb() {
  const [open, setOpen] = useState(false);
  const agents = db.agents.list();
  const defaultAgent = agents.find((a) => a.status === "live") ?? agents[0];
  const [activeId, setActiveId] = useState(defaultAgent?.id);
  const active = agents.find((a) => a.id === activeId) ?? defaultAgent;
  const [stateIdx, setStateIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStateIdx(0);
    const id = setInterval(() => setStateIdx((i) => (i + 1) % STATES.length), 2200);
    return () => clearInterval(id);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Talk to your agent"
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:brightness-110 active:scale-95 transition"
        style={{ animation: "voiceorb-pulse 2.4s ease-in-out infinite" }}
      >
        <Mic className="h-6 w-6" />
        <style>{`@keyframes voiceorb-pulse {0%,100%{box-shadow:0 0 0 0 hsl(var(--primary)/0.35)}50%{box-shadow:0 0 0 14px hsl(var(--primary)/0)}}`}</style>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <div className="flex flex-col items-center py-8 gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Talking to ·</span>
              <select
                value={active?.id}
                onChange={(e) => setActiveId(e.target.value)}
                className="bg-transparent text-sm font-medium focus:outline-none border border-border rounded-md px-2 py-1"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="relative h-56 w-56 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/20" style={{ animation: "voiceorb-breathe 3s ease-in-out infinite" }} />
              <div className="absolute inset-4 rounded-full bg-primary/30" style={{ animation: "voiceorb-breathe 3s ease-in-out infinite reverse" }} />
              <div className="relative h-32 w-32 rounded-full bg-primary shadow-2xl flex items-center justify-center">
                <Mic className="h-10 w-10 text-primary-foreground" />
              </div>
              <style>{`@keyframes voiceorb-breathe {0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.08);opacity:1}}`}</style>
            </div>

            <div className="text-center space-y-1">
              <p className="text-lg font-semibold">{STATES[stateIdx]}</p>
              <p className="text-sm text-muted-foreground">Ask about your pipeline, book a demo, or run a workflow.</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Volume2 className="h-3.5 w-3.5" />
              {active?.voice ?? "Default voice"}
            </div>

            <Button variant="destructive" onClick={() => setOpen(false)} className="gap-2">
              <PhoneOff className="h-4 w-4" /> End call
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}