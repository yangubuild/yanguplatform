import { useCallback, useEffect, useRef, useState } from "react";
import { FlaskConical, Plus, X, RefreshCw, ArrowLeft, MessageSquare, Mic } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpeakToBuild } from "@/components/builder/speak-to-build/SpeakToBuild";
import { SurfaceProvider } from "@/contexts/SurfaceContext";
import { AdaMainPanel } from "@/components/mass/ada/AdaMainPanel";
import { AvatarStudio } from "@/components/sandbox/AvatarStudio";
import {
  AiResearch,
  AiEbook,
  AudioToBuild,
  DeveloperCta,
  ProgressBar,
  type FeatureKey,
} from "@/components/sandbox/SandboxExtras";

type Note = {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
};

const NOTE_COLORS = [
  "#FEF3C7", // amber
  "#DBEAFE", // blue
  "#DCFCE7", // green
  "#FCE7F3", // pink
  "#EDE9FE", // purple
];

function StickyCanvas() {
  const [notes, setNotes] = useState<Note[]>(() => [
    { id: "n1", text: "Drag me anywhere", x: 40, y: 40, color: NOTE_COLORS[0] },
    { id: "n2", text: "Jot an idea", x: 220, y: 90, color: NOTE_COLORS[1] },
    { id: "n3", text: "Nothing here is saved", x: 120, y: 200, color: NOTE_COLORS[2] },
  ]);
  const draggingRef = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const addNote = () => {
    const id = `n${Date.now()}`;
    setNotes((prev) => [
      ...prev,
      {
        id,
        text: "New idea",
        x: 40 + Math.random() * 120,
        y: 40 + Math.random() * 120,
        color: NOTE_COLORS[prev.length % NOTE_COLORS.length],
      },
    ]);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    draggingRef.current = { id, offX: e.clientX - rect.left, offY: e.clientY - rect.top };
    target.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = draggingRef.current;
    if (!drag || !boardRef.current) return;
    const board = boardRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(board.width - 160, e.clientX - board.left - drag.offX));
    const y = Math.max(0, Math.min(board.height - 120, e.clientY - board.top - drag.offY));
    setNotes((prev) => prev.map((n) => (n.id === drag.id ? { ...n, x, y } : n)));
  };

  const onPointerUp = () => {
    draggingRef.current = null;
  };

  const remove = (id: string) => setNotes((p) => p.filter((n) => n.id !== id));
  const reset = () =>
    setNotes([
      { id: "n1", text: "Drag me anywhere", x: 40, y: 40, color: NOTE_COLORS[0] },
    ]);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Idea canvas</h3>
          <p className="text-xs text-muted-foreground">Drag sticky notes to plan freely — in-memory only.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={reset}>
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </Button>
          <Button size="sm" variant="accent" onClick={addNote}>
            <Plus className="w-3.5 h-3.5" /> Add note
          </Button>
        </div>
      </div>
      <div
        ref={boardRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative h-[360px] w-full rounded-lg overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0) 0 0 / 20px 20px, #0A1410",
        }}
      >
        {notes.map((n) => (
          <div
            key={n.id}
            onPointerDown={(e) => onPointerDown(e, n.id)}
            className="absolute w-40 min-h-[100px] rounded-lg shadow-lg cursor-grab active:cursor-grabbing select-none touch-none"
            style={{ left: n.x, top: n.y, background: n.color }}
          >
            <button
              onClick={() => remove(n.id)}
              className="absolute top-1 right-1 p-1 rounded-md hover:bg-black/10"
              aria-label="Remove note"
            >
              <X className="w-3 h-3 text-black/60" />
            </button>
            <textarea
              defaultValue={n.text}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full h-full bg-transparent p-3 pt-6 text-sm text-black/80 resize-none outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SandboxPage() {
  const [used, setUsed] = useState<Set<FeatureKey>>(new Set());
  const markUsed = useCallback((k: FeatureKey) => {
    setUsed((prev) => {
      if (prev.has(k)) return prev;
      const next = new Set(prev);
      next.add(k);
      return next;
    });
  }, []);

  // Ensure refresh = clean slate: clear Ada anon chats on mount/unmount.
  useEffect(() => {
    const KEY = "ada_anon_chats";
    const prev = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    return () => {
      // Restore prior state so the real Ada page isn't affected.
      if (prev) localStorage.setItem(KEY, prev);
      else localStorage.removeItem(KEY);
    };
  }, []);

  // "Create Avatar" Ada quick-action dispatches this event; we scroll to the studio.
  useEffect(() => {
    const handler = () => {
      document
        .getElementById("avatar-studio")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      markUsed("avatar");
    };
    window.addEventListener("yangu:create-avatar", handler);
    return () => window.removeEventListener("yangu:create-avatar", handler);
  }, [markUsed]);

  // Track first interaction inside the Ada chat panel.
  useEffect(() => {
    const panel = document.getElementById("ada-panel");
    if (!panel) return;
    const mark = () => markUsed("chat");
    panel.addEventListener("keydown", mark, { once: true });
    panel.addEventListener("click", mark, { once: true });
    return () => {
      panel.removeEventListener("keydown", mark);
      panel.removeEventListener("click", mark);
    };
  }, [markUsed]);

  return (
    <div className="min-h-dvh w-full" style={{ background: "#050A07" }}>
      {/* Top banner */}
      <div
        className="sticky top-0 z-30 border-b border-amber-500/20"
        style={{
          background:
            "linear-gradient(90deg, rgba(196,122,58,0.18) 0%, rgba(21,42,32,0.6) 100%)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <FlaskConical className="w-5 h-5 text-amber-300" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-foreground">Sandbox Mode</h1>
                <Badge className="bg-amber-500/15 text-amber-200 border border-amber-500/30 hover:bg-amber-500/15">
                  Test Mode
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                A playground to try Ada, voice and ideas. Nothing is saved or published.
              </p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => window.location.reload()}>
            <RefreshCw className="w-3.5 h-3.5" /> Reset session
          </Button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
        <ProgressBar used={used} />

        {/* Ada panel — Chat to Build */}
        <section
          id="ada-panel"
          className="rounded-lg border border-white/10 overflow-hidden scroll-mt-24"
          style={{ background: "#070D0A" }}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-medium text-foreground">Chat to Build — Ada AI</span>
              <Badge className="bg-amber-500/15 text-amber-200 border border-amber-500/30 hover:bg-amber-500/15 text-[10px]">
                Not saved
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">
              Conversation resets on refresh
            </span>
          </div>
          <div className="h-[640px] relative">
            <SurfaceProvider>
              <AdaMainPanel />
            </SurfaceProvider>
          </div>
        </section>

        {/* Speak to Build — permanent section */}
        <section
          id="speak-to-build"
          className="rounded-lg border border-white/10 overflow-hidden scroll-mt-24"
          style={{ background: "#070D0A" }}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-medium text-foreground">Speak to Build</span>
              <Badge className="bg-amber-500/15 text-amber-200 border border-amber-500/30 hover:bg-amber-500/15 text-[10px]">
                Not saved
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">
              Voice-first — tap and talk
            </span>
          </div>
          <div
            className="h-[520px]"
            onClickCapture={() => markUsed("voice")}
          >
            <SpeakToBuild
              onBack={() => {}}
              onComplete={() => markUsed("voice")}
              onSwitchToChat={() => {
                document.getElementById("ada-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />
          </div>
        </section>

        {/* Avatar Studio */}
        <div onClickCapture={() => markUsed("avatar")}>
          <AvatarStudio />
        </div>

        {/* AI Research */}
        <AiResearch onUsed={() => markUsed("research")} />

        {/* AI Ebook */}
        <AiEbook onUsed={() => markUsed("ebook")} />

        {/* Audio to Build */}
        <AudioToBuild onUsed={() => markUsed("audio")} />

        {/* Idea canvas */}
        <div onClickCapture={() => markUsed("canvas")}>
          <StickyCanvas />
        </div>

        {/* Developer CTA */}
        <DeveloperCta />

        <p className="text-xs text-muted-foreground text-center pb-4">
          You're in Sandbox Mode. Sign in and use the full dashboard to save your work.
        </p>
      </main>
    </div>
  );
}