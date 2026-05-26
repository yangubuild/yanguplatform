import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Download,
  FileText,
  Loader2,
  Mic,
  Search,
  Sparkles,
  Square,
  Code2,
} from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function NotSavedBadge() {
  return (
    <Badge className="bg-amber-500/15 text-amber-200 border border-amber-500/30 hover:bg-amber-500/15 text-[10px]">
      Not saved
    </Badge>
  );
}

export function SectionShell({
  id,
  title,
  icon,
  children,
  onUsed,
  usedKey,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onUsed?: (key: string) => void;
  usedKey?: string;
}) {
  // Fire "used" event once children render and feature is interacted with.
  // (Tracking is wired inside individual sections via onUsed prop on actions.)
  return (
    <section
      id={id}
      data-used-key={usedKey}
      className="rounded-lg border border-white/10 overflow-hidden scroll-mt-24"
      style={{ background: "#070D0A" }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-foreground">{title}</span>
          <NotSavedBadge />
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

// Calls Ada via the sandbox-ada edge function (Lovable AI Gateway).
async function callAda(systemPrompt: string, userPrompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("sandbox-ada", {
    body: { system: systemPrompt, prompt: userPrompt },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "Ada call failed");
  return data.text as string;
}

/* ----------------------- AI Research ----------------------- */

type ResearchBrief = {
  title: string;
  summary: string;
  key_points: string[];
  sources: { title: string; url?: string }[];
};

export function AiResearch({ onUsed }: { onUsed: () => void }) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<ResearchBrief | null>(null);

  const run = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setBrief(null);
    try {
      const raw = await callAda(
        "You are Ada, a structured research assistant. Always reply with strict JSON only — no markdown — matching: {\"title\":string,\"summary\":string,\"key_points\":string[],\"sources\":[{\"title\":string,\"url\":string}]}. Aim for 4-6 key points and 3-5 plausible sources.",
        `Research topic: ${topic}`,
      );
      const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleaned) as ResearchBrief;
      setBrief(parsed);
      onUsed();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't build research brief");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionShell id="ai-research" title="AI Research" icon={<Search className="w-4 h-4 text-amber-300" />}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value.slice(0, 200))}
            placeholder="e.g. Coffee shop trends in Nairobi 2026"
            className="bg-white/[0.03] border-white/10 flex-1 min-w-[240px]"
          />
          <Button variant="accent" disabled={!topic.trim() || loading} onClick={run}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Research
          </Button>
        </div>
        {brief && (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
            <h4 className="text-base font-semibold text-foreground">{brief.title}</h4>
            <p className="text-sm text-muted-foreground">{brief.summary}</p>
            <div>
              <div className="text-xs uppercase tracking-wider text-amber-300/70 mb-1">Key points</div>
              <ul className="list-disc pl-5 text-sm text-foreground space-y-1">
                {brief.key_points?.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-amber-300/70 mb-1">Sources</div>
              <ul className="text-sm space-y-1">
                {brief.sources?.map((s, i) => (
                  <li key={i} className="text-foreground">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer" className="underline text-[#F4A83D]">
                        {s.title || s.url}
                      </a>
                    ) : (
                      s.title
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </SectionShell>
  );
}

/* ----------------------- AI Ebook Generator ----------------------- */

type Ebook = {
  title: string;
  sections: { heading: string; intro: string }[];
};

export function AiEbook({ onUsed }: { onUsed: () => void }) {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [ebook, setEbook] = useState<Ebook | null>(null);

  const run = async () => {
    if (!title.trim() || !topic.trim()) return;
    setLoading(true);
    setEbook(null);
    try {
      const raw = await callAda(
        "You are Ada, an ebook outliner. Reply with strict JSON only (no markdown): {\"title\":string,\"sections\":[{\"heading\":string,\"intro\":string}]} with exactly 5 sections. Each intro is 2-3 sentences.",
        `Ebook title: ${title}\nTopic: ${topic}`,
      );
      const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleaned) as Ebook;
      setEbook(parsed);
      onUsed();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't build ebook");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!ebook) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 56;
    const maxW = pageW - margin * 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(ebook.title, margin, 90);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Generated in Yangu Sandbox — Test Mode", margin, 112);
    let y = 160;
    ebook.sections.forEach((s, i) => {
      if (y > 720) { doc.addPage(); y = 80; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      const heading = `${i + 1}. ${s.heading}`;
      doc.text(heading, margin, y);
      y += 22;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(s.intro, maxW);
      doc.text(lines, margin, y);
      y += lines.length * 14 + 24;
    });
    doc.save(`${title.toLowerCase().replace(/\s+/g, "-") || "ebook"}.pdf`);
  };

  return (
    <SectionShell id="ai-ebook" title="AI Ebook Generator" icon={<BookOpen className="w-4 h-4 text-amber-300" />}>
      <div className="flex flex-col gap-3">
        <div className="grid md:grid-cols-2 gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 80))}
            placeholder="Ebook title"
            className="bg-white/[0.03] border-white/10"
          />
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value.slice(0, 200))}
            placeholder="What's it about?"
            className="bg-white/[0.03] border-white/10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="accent" disabled={!title.trim() || !topic.trim() || loading} onClick={run}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate outline
          </Button>
          {ebook && (
            <Button variant="ghost" onClick={downloadPdf}>
              <Download className="w-4 h-4" /> Download PDF
            </Button>
          )}
        </div>
        {ebook && (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
            <h4 className="text-base font-semibold text-foreground">{ebook.title}</h4>
            <ol className="space-y-3">
              {ebook.sections.map((s, i) => (
                <li key={i}>
                  <div className="text-sm font-medium text-foreground">{i + 1}. {s.heading}</div>
                  <p className="text-sm text-muted-foreground mt-1">{s.intro}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </SectionShell>
  );
}

/* ----------------------- Audio to Build ----------------------- */

export function AudioToBuild({ onUsed }: { onUsed: () => void }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(120);

  const supported = typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const stop = () => {
    try { recognitionRef.current?.stop(); } catch {}
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    setRecording(false);
  };

  const start = () => {
    if (!supported) {
      toast.error("Speech recognition isn't supported in this browser. Try Chrome.");
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript + " ";
        else interimText += r[0].transcript;
      }
      if (finalText) setTranscript((p) => (p + " " + finalText).trim());
      setInterim(interimText);
    };
    rec.onerror = () => stop();
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
    setSecondsLeft(120);
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { stop(); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => stop(), []);

  const sendToAda = () => {
    if (!transcript.trim()) return;
    onUsed();
    // Hand off to the Ada panel via the same event Speak-to-Build uses.
    window.dispatchEvent(new CustomEvent("yangu:ada-prompt", { detail: { prompt: transcript } }));
    document.getElementById("ada-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    toast.success("Transcript sent to Ada");
  };

  return (
    <SectionShell id="audio-to-build" title="Audio to Build" icon={<Mic className="w-4 h-4 text-amber-300" />}>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Speak for up to 2 minutes. We'll transcribe it locally and send it to Ada as a build prompt.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {recording ? (
            <Button variant="destructive" onClick={stop}>
              <Square className="w-4 h-4" /> Stop ({secondsLeft}s)
            </Button>
          ) : (
            <Button variant="accent" onClick={start} disabled={!supported}>
              <Mic className="w-4 h-4" /> Start recording
            </Button>
          )}
          <Button variant="ghost" onClick={() => { setTranscript(""); setInterim(""); }}>
            Clear
          </Button>
          <Button variant="ghost" disabled={!transcript.trim()} onClick={sendToAda}>
            Send to Ada
          </Button>
          {!supported && (
            <span className="text-[11px] text-amber-300">Use Chrome / Edge for speech recognition.</span>
          )}
        </div>
        <Textarea
          value={transcript + (interim ? ` ${interim}` : "")}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Transcript will appear here…"
          className="min-h-[140px] bg-white/[0.03] border-white/10"
        />
      </div>
    </SectionShell>
  );
}

/* ----------------------- Developer CTA ----------------------- */

export function DeveloperCta() {
  return (
    <section
      className="rounded-2xl overflow-hidden p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 border border-amber-500/20"
      style={{
        background:
          "linear-gradient(135deg, #152A20 0%, #0A1410 60%, #1F0F08 100%)",
      }}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Code2 className="w-5 h-5 text-amber-300" />
          <div className="text-[10px] uppercase tracking-widest text-amber-300/70">For developers</div>
        </div>
        <h3 className="text-xl md:text-2xl font-semibold text-white">
          Are you a developer? Build on Yangu.
        </h3>
        <p className="text-sm text-white/70 mt-2 max-w-xl">
          Ship apps, automations and AI tools to thousands of African and Middle East businesses.
          Use our APIs, AI Gateway and storefront infrastructure.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 md:flex-shrink-0">
        <Button asChild variant="accent">
          <Link to="/developer">
            <FileText className="w-4 h-4" /> View API Docs
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/developer/submit">
            <Sparkles className="w-4 h-4" /> Submit your app
          </Link>
        </Button>
      </div>
    </section>
  );
}

/* ----------------------- Progress Checklist ----------------------- */

const FEATURE_KEYS = [
  { key: "chat", label: "Chat to Build" },
  { key: "voice", label: "Speak to Build" },
  { key: "avatar", label: "Avatar Studio" },
  { key: "research", label: "AI Research" },
  { key: "ebook", label: "AI Ebook" },
  { key: "audio", label: "Audio to Build" },
  { key: "canvas", label: "Idea Canvas" },
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number]["key"];

export function ProgressBar({ used }: { used: Set<FeatureKey> }) {
  const target = 3;
  const count = Math.min(used.size, FEATURE_KEYS.length);
  const pct = Math.min(100, (count / target) * 100);
  const unlocked = count >= target;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-foreground font-medium">
          {unlocked
            ? "Full demo unlocked 🎉 Sign up to keep what you build."
            : `Try 3 features to unlock a full demo (${count}/${target})`}
        </div>
        {unlocked && (
          <Button asChild size="sm" variant="accent">
            <Link to="/auth/signup">Create free account</Link>
          </Button>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#F4A83D,#C47A3A)" }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {FEATURE_KEYS.map((f) => {
          const done = used.has(f.key);
          return (
            <span
              key={f.key}
              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                done
                  ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30"
                  : "bg-white/[0.03] text-muted-foreground border-white/10"
              }`}
            >
              {done ? "✓ " : ""}{f.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}