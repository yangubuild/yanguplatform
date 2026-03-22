import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Mic, ArrowUp, Search, Building2, Star as StarIcon, Users as UsersIcon, Palette, Wrench, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSearchEntities } from "@/hooks/landing/useSearchEntities";
import { useLandingCounters } from "@/hooks/landing/useLandingCounters";
import { getEntityRoute, isExternalRoute } from "@/lib/entityRouting";
import type { SearchEntityResult } from "@/types/search";
import { ENTITY_TYPE_CONFIG } from "@/types/search";

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
        if (elapsed>= TYPING_SPEED) {
          lastTick.current = now;
          charIdx.current++;
          setDisplay(currentPrompt.slice(0, charIdx.current));
          if (charIdx.current>= currentPrompt.length) {
            phase.current = "pausing";
          }
        }
      } else if (phase.current === "pausing") {
        if (elapsed>= PAUSE_AFTER_TYPE) {
          lastTick.current = now;
          phase.current = "erasing";
        }
      } else if (phase.current === "erasing") {
        if (elapsed>= ERASING_SPEED) {
          lastTick.current = now;
          charIdx.current--;
          setDisplay(currentPrompt.slice(0, charIdx.current));
          if (charIdx.current <= 0) {
            phase.current = "waiting";
          }
        }
      } else if (phase.current === "waiting") {
        if (elapsed>= PAUSE_AFTER_ERASE) {
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

// Ramp animation config
const RAMP_DURATION = 4000;

function useLiveStats() {
  const { data: counters } = useLandingCounters();

  const targets = [
    { label: "earned", target: 0, increment: 0, prefix: "$" }, // deferred
    { label: "users", target: counters?.users ?? 0, increment: 0.12, prefix: "" },
    { label: "businesses", target: counters?.businesses ?? 0, increment: 0.05, prefix: "" },
  ];

  const [values, setValues] = useState(() => targets.map(() => 0));
  const startTime = useRef(performance.now());
  const reached = useRef(targets.map(() => false));
  const targetsRef = useRef(targets);
  targetsRef.current = targets;

  useEffect(() => {
    // Reset on target change
    reached.current = targetsRef.current.map(() => false);
    startTime.current = performance.now();
  }, [counters?.users, counters?.businesses]);

  useEffect(() => {
    let raf: number;
    const step = (now: number) => {
      const elapsed = now - startTime.current;
      setValues(prev =>
        prev.map((v, i) => {
          const cfg = targetsRef.current[i];
          if (!cfg || cfg.target === 0) return 0;
          if (!reached.current[i]) {
            const t = Math.min(elapsed / RAMP_DURATION, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            const val = Math.round(cfg.target * eased);
            if (t>= 1) reached.current[i] = true;
            return val;
          }
          const jitter = 0.5 + Math.random();
          return +(v + cfg.increment * jitter).toFixed(0);
        })
      );
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return targets.map((t, i) => ({
    label: t.label,
    display: t.prefix + (values[i] || 0).toLocaleString("en-US"),
    hidden: t.target === 0,
  }));
}

const ENTITY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  business: Building2,
  creator: StarIcon,
  community: UsersIcon,
  project: Palette,
  service: Wrench,
  product: Package,
  organization: Building2,
};

function EntityResultCard({ entity }: { entity: SearchEntityResult }) {
  const navigate = useNavigate();
  const route = getEntityRoute(entity);
  const external = isExternalRoute(route);
  const Icon = ENTITY_ICONS[entity.entity_type] || Building2;

  return (
    <button
      onClick={() => external ? window.open(route, "_blank") : navigate(route)}
      className="flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-colors hover:opacity-80 w-full"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {entity.cover_image_url ? (
        <img src={entity.cover_image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <Icon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-foreground text-sm font-semibold truncate">{entity.title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
            {ENTITY_TYPE_CONFIG[entity.entity_type]?.label || entity.entity_type}
          </span>
        </div>
        {entity.short_description && (
          <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{entity.short_description}</p>
        )}
      </div>
    </button>
  );
}

export function LandingTestPromptArea() {
  const [mode, setMode] = useState<"build" | "explore">("build");
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const animatedText = useTypingAnimation(BUILD_PROMPTS, mode === "build" && !inputValue);
  const stats = useLiveStats();

  // Debounce search
  useEffect(() => {
    if (mode !== "explore") return;
    const t = setTimeout(() => setSearchQuery(inputValue.trim()), 300);
    return () => clearTimeout(t);
  }, [inputValue, mode]);

  const { data: searchResults, isLoading: searching } = useSearchEntities(
    { query: searchQuery || undefined, limit: 8 },
    mode === "explore" && searchQuery.length>= 2,
    `explore-${searchQuery}`,
  );

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    if (mode === "build") {
      // Transfer prompt text to ADA AI page via query param
      navigate(`/ada?prompt=${encodeURIComponent(inputValue.trim())}`);
    } else {
      // Explore search — navigate to discover with query
      navigate(`/discover?q=${encodeURIComponent(inputValue.trim())}`);
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
          borderRadius: '14px' }}>
        <button
          className="px-7 py-2.5 text-sm font-medium transition-all"
          style={mode === "build" ? {
            background: 'linear-gradient(135deg, #c47a3a 0%, #b5622a 50%, #5c2a12 100%)',
            color: '#fff',
            borderRadius: '10px',
          } : {
            background: 'transparent',
            color: 'rgba(255,255,255,0.45)',
            borderRadius: '10px' }}
          onClick={() => { setMode("build"); setInputValue(""); setSearchQuery(""); }}>
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
            borderRadius: '10px' }}
          onClick={() => { setMode("explore"); setInputValue(""); setSearchQuery(""); }}>
          Explore
        </button>
      </div>

      {/* BUILD mode = large AI chat bar */}
      {mode === "build" && (
        <div
          className="w-full max-w-[700px] rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-5 pt-5 pb-2 relative">
            {!inputValue && (
              <div className="absolute inset-0 px-5 pt-5 pb-2 pointer-events-none flex items-start">
                <span className="text-muted-foreground text-base">
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
              className="w-full bg-transparent text-foreground text-base focus:outline-none relative z-10"
            />
          </div>
          <div className="flex items-center justify-between px-4 pb-4">
            <button className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Mic className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={handleSubmit}
                className="w-9 h-9 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <ArrowUp className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPLORE mode = slim search bar + live results */}
      {mode === "explore" && (
        <div className="w-full max-w-[700px]">
          <div
            className="flex items-center gap-3 px-5 py-3"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: searchResults && searchResults.length> 0 ? '20px 20px 0 0' : '999px' }}>
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Search yangu to buy, learn, create or sell..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              className="w-8 h-8 flex items-center justify-center rounded-full shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <ArrowUp className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Live search results dropdown */}
          {searchResults && searchResults.length> 0 && (
            <div
              className="rounded-b-2xl overflow-hidden divide-y divide-white/[0.04]"
              style={{ background: 'rgba(255,255,255,0.04)', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {searchResults.map((entity) => (
                <EntityResultCard key={entity.id} entity={entity} />
              ))}
            </div>
          )}

          {searching && searchQuery.length>= 2 && (
            <div className="text-center py-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Searching...
            </div>
          )}
        </div>
      )}

      {/* Stats row — live counting from platform state */}
      <div className="flex items-center justify-center gap-8 flex-wrap">
        {stats.filter(s => !s.hidden).map((s) => (
          <span key={s.label} className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <span className="font-semibold text-muted-foreground tabular-nums">{s.display}</span> {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
