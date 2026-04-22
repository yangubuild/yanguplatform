/**
 * VoiceOrb — animated audio-reactive orb for the Speak-to-Build call screen.
 *
 * Pure presentational. Reacts to `level` (0..1) and `state`.
 *  - speaking: gentle pulse, primary glow
 *  - listening: scales with mic level, accent glow
 *  - thinking: rotating shimmer
 *  - idle: soft static
 */

import { useEffect, useRef } from "react";

export type OrbState = "idle" | "listening" | "speaking" | "thinking";

interface Props {
  state: OrbState;
  /** 0..1 normalized RMS from VAD. */
  level?: number;
  onTap?: () => void;
  ariaLabel?: string;
}

export function VoiceOrb({ state, level = 0, onTap, ariaLabel }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  // Map level to scale factor smoothly via rAF for the listening state.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target =
      state === "listening" ? 1 + Math.min(0.35, level * 0.6) :
      state === "speaking"  ? 1.08 :
      state === "thinking"  ? 1.02 :
      1;
    el.style.setProperty("--orb-scale", String(target));
  }, [level, state]);

  const stateClass =
    state === "speaking"  ? "orb-speaking"  :
    state === "listening" ? "orb-listening" :
    state === "thinking"  ? "orb-thinking"  :
    "orb-idle";

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={ariaLabel || "Voice orb"}
      className="relative grid place-items-center w-[260px] h-[260px] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      {/* Outer halo */}
      <div className={`absolute inset-0 rounded-full blur-3xl opacity-60 ${
        state === "speaking" ? "bg-primary/40" :
        state === "listening" ? "bg-accent/40" :
        state === "thinking" ? "bg-primary/30" :
        "bg-muted/30"
      }`} />

      {/* Concentric rings */}
      <div className={`absolute inset-6 rounded-full border border-foreground/10 ${
        state === "listening" ? "animate-ping-slow" : ""
      }`} />
      <div className={`absolute inset-12 rounded-full border border-foreground/10`} />

      {/* Core orb */}
      <div
        ref={ref}
        className={`relative w-[170px] h-[170px] rounded-full transition-transform duration-150 ease-out ${stateClass}`}
        style={{
          transform: "scale(var(--orb-scale, 1))",
          background:
            "radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.95), hsl(var(--primary) / 0.55) 55%, hsl(var(--primary) / 0.15) 100%)",
          boxShadow:
            "0 0 60px hsl(var(--primary) / 0.55), inset 0 0 40px hsl(var(--background) / 0.25)",
        }}
      >
        {/* Inner shimmer */}
        <div
          className={`absolute inset-0 rounded-full mix-blend-overlay ${
            state === "thinking" ? "animate-spin-slow" : ""
          }`}
          style={{
            background:
              "conic-gradient(from 0deg, transparent, hsl(var(--background) / 0.35), transparent 40%, hsl(var(--background) / 0.2), transparent 80%)",
          }}
        />
      </div>

      <style>{`
        .orb-speaking { animation: orb-pulse 1.6s ease-in-out infinite; }
        .orb-idle     { animation: orb-breathe 4s ease-in-out infinite; opacity: 0.85; }
        @keyframes orb-pulse {
          0%, 100% { filter: brightness(1); }
          50%      { filter: brightness(1.2); }
        }
        @keyframes orb-breathe {
          0%, 100% { transform: scale(0.98); }
          50%      { transform: scale(1.02); }
        }
        .animate-ping-slow { animation: ping-slow 2.4s cubic-bezier(0,0,0.2,1) infinite; }
        @keyframes ping-slow {
          0%   { transform: scale(1); opacity: 0.6; }
          80%, 100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
      `}</style>
    </button>
  );
}
