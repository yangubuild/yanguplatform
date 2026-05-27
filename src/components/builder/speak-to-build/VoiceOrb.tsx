/**
 * VoiceOrb — fully circular, audio-reactive voice orb.
 * No square wrappers, no bg-box blur halos, no rectangular artifacts.
 * All glow comes from circular radial-gradients + box-shadow on rounded-full elements.
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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target =
      state === "listening" ? 1 + Math.min(0.35, level * 0.6) :
      state === "speaking"  ? 1.08 :
      state === "thinking"  ? 1.02 :
      1;
    el.style.setProperty("--orb-scale", String(target));

    // Halo intensity reacts to voice level too
    const haloScale = state === "listening" ? 1 + Math.min(0.25, level * 0.5) : 1;
    el.style.setProperty("--halo-scale", String(haloScale));
  }, [level, state]);

  const stateClass =
    state === "speaking"  ? "orb-speaking"  :
    state === "listening" ? "orb-listening" :
    state === "thinking"  ? "orb-thinking"  :
    "orb-idle";

  const haloColor =
    state === "speaking" ? "var(--primary)" :
    state === "listening" ? "var(--accent)" :
    state === "thinking" ? "var(--primary)" :
    "var(--muted)";

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={ariaLabel || "Voice orb"}
      className="relative grid place-items-center w-[340px] h-[340px] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 border-0 p-0"
      style={{ background: "transparent" }}
    >
      {/* Circular ambient halo — radial-gradient on a circular element, no blur-box edges */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 rounded-full pointer-events-none transition-transform duration-200 ease-out"
        style={{
          width: 340,
          height: 340,
          transform: "translate(-50%, -50%) scale(var(--halo-scale, 1))",
          background: `radial-gradient(circle at center, hsl(${haloColor} / 0.45) 0%, hsl(${haloColor} / 0.18) 25%, hsl(${haloColor} / 0.06) 45%, transparent 65%)`,
        }}
      />

      {/* Reactive ping rings — listening only */}
      {state === "listening" && (
        <>
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 rounded-full pointer-events-none animate-ping-ring"
            style={{
              width: 200,
              height: 200,
              border: `1px solid hsl(${haloColor} / 0.35)`,
            }}
          />
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 rounded-full pointer-events-none animate-ping-ring-2"
            style={{
              width: 200,
              height: 200,
              border: `1px solid hsl(${haloColor} / 0.22)`,
            }}
          />
        </>
      )}

      {/* Core orb. `isolation: isolate` + `overflow: hidden` are required so
          the inner mix-blend shimmer is clipped to a circle on iOS Safari,
          which otherwise ignores border-radius on mix-blend layers and paints
          a visible square box around the orb. */}
      <div
        ref={ref}
        className={`relative w-[180px] h-[180px] rounded-full overflow-hidden transition-transform duration-150 ease-out ${stateClass}`}
        style={{
          transform: "scale(var(--orb-scale, 1))",
          isolation: "isolate",
          background:
            "radial-gradient(circle at 32% 28%, hsl(var(--primary) / 0.98), hsl(var(--primary) / 0.6) 55%, hsl(var(--primary) / 0.18) 100%)",
          boxShadow:
            "0 0 80px 10px hsl(var(--primary) / 0.45), inset 0 0 40px hsl(var(--background) / 0.25)",
          WebkitMaskImage: "radial-gradient(circle, #000 99%, transparent 100%)",
          maskImage: "radial-gradient(circle, #000 99%, transparent 100%)",
        }}
      >
        {/* Inner shimmer — wrapped in its own rounded-full clip so the conic
            gradient + mix-blend stay circular on iOS Safari. */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
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
      </div>

      <style>{`
        .orb-speaking { animation: orb-pulse 1.6s ease-in-out infinite; }
        .orb-idle     { animation: orb-breathe 4s ease-in-out infinite; opacity: 0.9; }
        .orb-listening { animation: orb-breathe 2.4s ease-in-out infinite; }
        @keyframes orb-pulse {
          0%, 100% { filter: brightness(1); }
          50%      { filter: brightness(1.2); }
        }
        @keyframes orb-breathe {
          0%, 100% { filter: brightness(1); }
          50%      { filter: brightness(1.08); }
        }
        .animate-ping-ring { animation: ping-ring 2.4s cubic-bezier(0,0,0.2,1) infinite; }
        .animate-ping-ring-2 { animation: ping-ring 2.4s cubic-bezier(0,0,0.2,1) infinite 1.2s; }
        @keyframes ping-ring {
          0%   { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; }
          80%, 100% { transform: translate(-50%, -50%) scale(1.7); opacity: 0; }
        }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
      `}</style>
    </button>
  );
}
