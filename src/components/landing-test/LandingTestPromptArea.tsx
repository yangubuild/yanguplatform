import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Mic, ArrowUp, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BUILD_PROMPTS = [
  "Launch a custom emoji design shop...",
  "Start an online coaching business...",
  "Create a digital product brand...",
  "Build a course marketplace...",
  "Open a print-on-demand store...",
  "Design a subscription box service...",
];

const TYPING_SPEED = 45;
const ERASING_SPEED = 25;
const PAUSE_AFTER_TYPE = 2200;
const PAUSE_AFTER_ERASE = 400;

function useTypingAnimation(prompts: string[], active: boolean) {
  const [display, setDisplay] = useState("");
  const idx = useRef(0);
  const charIdx = useRef(0);
  const phase = useRef<"typing" | "pausing" | "erasing" | "waiting">("typing");
  const raf = useRef<number | null>(null);
  const lastTick = useRef(0);

  useEffect(() => {
    if (!active) {
      setDisplay("");
      idx.current = 0;
      charIdx.current = 0;
      phase.current = "typing";
      return;
    }

    const step = (now: number) => {
      const elapsed = now - lastTick.current;
      const currentPrompt = prompts[idx.current % prompts.length];

      if (phase.current === "typing") {
        if (elapsed >= TYPING_SPEED) {
          lastTick.current = now;
          charIdx.current++;
          setDisplay(currentPrompt.slice(0, charIdx.current));
          if (charIdx.current >= currentPrompt.length) {
            phase.current = "pausing";
          }
        }
      } else if (phase.current === "pausing") {
        if (elapsed >= PAUSE_AFTER_TYPE) {
          lastTick.current = now;
          phase.current = "erasing";
        }
      } else if (phase.current === "erasing") {
        if (elapsed >= ERASING_SPEED) {
          lastTick.current = now;
          charIdx.current--;
          setDisplay(currentPrompt.slice(0, charIdx.current));
          if (charIdx.current <= 0) {
            phase.current = "waiting";
          }
        }
      } else if (phase.current === "waiting") {
        if (elapsed >= PAUSE_AFTER_ERASE) {
          lastTick.current = now;
          idx.current = (idx.current + 1) % prompts.length;
          charIdx.current = 0;
          phase.current = "typing";
        }
      }

      raf.current = requestAnimationFrame(step);
    };

    lastTick.current = performance.now();
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [active, prompts]);

  return display;
}

// Live counting stats
const STATS_CONFIG = [
  { label: "earned", base: 2_770_949_959, increment: 0.47, prefix: "$", suffix: "" },
  { label: "users", base: 22_277_339, increment: 0.12, prefix: "", suffix: "" },
  { label: "businesses", base: 2_420_966, increment: 0.05, prefix: "", suffix: "" },
];

function useLiveStats() {
  const [values, setValues] = useState(() => STATS_CONFIG.map(s => s.base));

  useEffect(() => {
    const interval = setInterval(() => {
      setValues(prev =>
        prev.map((v, i) => {
          const jitter = 0.5 + Math.random();
          return +(v + STATS_CONFIG[i].increment * jitter).toFixed(0);
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return values.map((v, i) => ({
    label: STATS_CONFIG[i].label,
    display: STATS_CONFIG[i].prefix + v.toLocaleString("en-US") + STATS_CONFIG[i].suffix,
  }));
}

export function LandingTestPromptArea() {
  const [mode, setMode] = useState<"build" | "explore">("build");
  const [inputValue, setInputValue] = useState("");
  const navigate = useNavigate();
  const animatedText = useTypingAnimation(BUILD_PROMPTS, mode === "build" && !inputValue);
  const stats = useLiveStats();

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    if (mode === "build") {
      navigate("/ada");
    } else {
      // search mode — future wiring
    }
  };

  return (
    <div className="flex flex-col items-center py-8 gap-6">
      {/* Toggle */}
      <div
        className="inline-flex items-center p-1.5"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
        }}
      >
        <button
          className="px-7 py-2.5 text-sm font-medium transition-all"
          style={mode === "build" ? {
            background: 'linear-gradient(135deg, #c47a3a 0%, #b5622a 50%, #5c2a12 100%)',
            color: '#fff',
            borderRadius: '10px',
          } : {
            background: 'transparent',
            color: 'rgba(255,255,255,0.45)',
            borderRadius: '10px',
          }}
          onClick={() => { setMode("build"); setInputValue(""); }}
        >
          Build
        </button>
        <button
          className="px-7 py-2.5 text-sm font-medium transition-all"
          style={mode === "explore" ? {
            background: 'linear-gradient(135deg, #c47a3a 0%, #b5622a 50%, #5c2a12 100%)',
            color: '#fff',
            borderRadius: '10px',
          } : {
            background: 'transparent',
            color: 'rgba(255,255,255,0.45)',
            borderRadius: '10px',
          }}
          onClick={() => { setMode("explore"); setInputValue(""); }}
        >
          Explore
        </button>
      </div>

      {/* BUILD mode = large AI chat bar */}
      {mode === "build" && (
        <div
          className="w-full max-w-[700px] rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="px-5 pt-5 pb-2 relative">
            {!inputValue && (
              <div className="absolute inset-0 px-5 pt-5 pb-2 pointer-events-none flex items-start">
                <span className="text-white/30 text-base">
                  {animatedText}
                  <span className="inline-block w-[2px] h-[1.1em] bg-white/40 align-text-bottom ml-px animate-pulse" />
                </span>
              </div>
            )}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder=""
              className="w-full bg-transparent text-white text-base focus:outline-none relative z-10"
            />
          </div>
          <div className="flex items-center justify-between px-4 pb-4">
            <button className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Plus className="w-4 h-4 text-white/40" />
            </button>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Mic className="w-4 h-4 text-white/40" />
              </button>
              <button
                onClick={handleSubmit}
                className="w-9 h-9 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <ArrowUp className="w-4 h-4 text-white/40" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPLORE mode = slim search bar (static placeholder) */}
      {mode === "explore" && (
        <div
          className="w-full max-w-[700px] flex items-center gap-3 px-5 py-3"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '999px',
          }}
        >
          <Search className="w-4 h-4 text-white/40 shrink-0" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Search yangu to buy, learn, create or sell..."
            className="flex-1 bg-transparent text-white placeholder:text-white/30 text-sm focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            className="w-8 h-8 flex items-center justify-center rounded-full shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <ArrowUp className="w-4 h-4 text-white/40" />
          </button>
        </div>
      )}

      {/* Stats row — live counting */}
      <div className="flex items-center justify-center gap-8 flex-wrap">
        {stats.map((s) => (
          <span key={s.label} className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <span className="font-semibold text-white/50 tabular-nums">{s.display}</span> {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
