import { useEffect, useState } from "react";
import { PhoneOff, Volume2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAgents } from "./data/hooks";
import { YanguGlowBall, VOICE_STATE_LABEL, type VoiceState } from "@/components/brand/YanguGlowBall";

const STATES: VoiceState[] = ["listening", "thinking", "speaking"];

export function VoiceOrb() {
  const [open, setOpen] = useState(false);
  const { data: agents = [] } = useAgents();
  const defaultAgent = agents.find((a) => a.status === "live") ?? agents[0];
  const [activeId, setActiveId] = useState(defaultAgent?.id);
  const active = agents.find((a) => a.id === activeId) ?? defaultAgent;
  const [stateIdx, setStateIdx] = useState(0);
  const voiceState: VoiceState = STATES[stateIdx];

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
        className="fixed bottom-[104px] right-3 sm:right-6 z-40 hidden sm:flex h-14 w-14 sm:bottom-6 sm:right-6 items-center justify-center rounded-full transition active:scale-95"
      >
        <YanguGlowBall state="idle" size={56} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl yangu-surface yangu-border-gradient">
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

            <YanguGlowBall state={voiceState} size={200} />

            <div className="text-center space-y-1">
              <p className="text-lg font-semibold">{VOICE_STATE_LABEL[voiceState]}</p>
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