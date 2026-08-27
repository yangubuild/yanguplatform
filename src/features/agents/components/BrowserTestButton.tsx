// Browser voice test. The session token is fetched from the server, which
// returns a publishable key only — the private voice key never reaches the client.

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { voiceOps } from "../data/builderDb";
import { YanguSpinner } from "./YanguSpinner";

type Phase = "idle" | "checking" | "connecting" | "live" | "unavailable" | "error";

export function BrowserTestButton({ agentId }: { agentId: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const clientRef = useRef<any>(null);

  useEffect(() => () => { try { clientRef.current?.stop(); } catch { /* nothing to stop */ } }, []);

  async function start() {
    setPhase("checking");
    setMessage(null);
    try {
      const cfg = await voiceOps.webTest(agentId);
      if (!cfg.available) {
        setPhase("unavailable");
        setMessage(cfg.message ?? "Browser voice testing is not available yet.");
        return;
      }
      setPhase("connecting");
      const { default: Vapi } = await import("@vapi-ai/web");
      const client = new Vapi(cfg.publicKey!);
      clientRef.current = client;
      client.on("call-start", () => setPhase("live"));
      client.on("call-end", () => setPhase("idle"));
      client.on("error", (e: any) => {
        setPhase("error");
        setMessage(typeof e?.message === "string" ? e.message : "The voice test could not continue.");
      });
      await client.start(cfg.assistantId!);
    } catch (e) {
      setPhase("error");
      setMessage(e instanceof Error ? e.message : "The voice test could not start.");
    }
  }

  function stop() {
    try { clientRef.current?.stop(); } catch { /* already stopped */ }
    setPhase("idle");
  }

  const busy = phase === "checking" || phase === "connecting";

  return (
    <div className="space-y-2">
      {phase === "live" ? (
        <Button size="sm" variant="destructive" onClick={stop}>
          <MicOff className="mr-1.5 h-4 w-4" />End test call
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={start} disabled={busy}>
          {busy ? <YanguSpinner size={16} className="mr-1.5" /> : <Mic className="mr-1.5 h-4 w-4" />}
          {phase === "checking" ? "Checking voice setup…" : phase === "connecting" ? "Connecting…" : "Talk to this agent"}
        </Button>
      )}
      {phase === "live" && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
          <YanguSpinner size={14} />You're connected — speak to your agent.
        </p>
      )}
      {(phase === "unavailable" || phase === "error") && message && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />{message}
        </p>
      )}
    </div>
  );
}
