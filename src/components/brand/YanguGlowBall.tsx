// The official Yangu glow ball — the single visual identity for Yangu AI voice.
// Never replace with a microphone, waveform, sparkle, robot or avatar.

import glowBall from "@/assets/yangu-glow-ball.png";
import { cn } from "@/lib/utils";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "connecting" | "error";

const MOTION: Record<VoiceState, { duration: string; scale: string; halo: number }> = {
  idle: { duration: "6s", scale: "1.015", halo: 0.28 },
  listening: { duration: "2.4s", scale: "1.05", halo: 0.5 },
  thinking: { duration: "4.5s", scale: "1.03", halo: 0.4 },
  speaking: { duration: "1.4s", scale: "1.075", halo: 0.62 },
  connecting: { duration: "1.9s", scale: "1.04", halo: 0.45 },
  error: { duration: "7s", scale: "1.01", halo: 0.22 },
};

export const VOICE_STATE_LABEL: Record<VoiceState, string> = {
  idle: "Ready",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  connecting: "Connecting…",
  error: "Something went wrong",
};

export function YanguGlowBall({
  state = "idle",
  size = 96,
  className,
}: {
  state?: VoiceState;
  size?: number;
  className?: string;
}) {
  const m = MOTION[state];
  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className="absolute -inset-[18%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, hsl(157 100% 38% / 0.5), transparent 62%), radial-gradient(circle at 72% 68%, hsl(25 100% 50% / 0.55), transparent 62%)",
          filter: "blur(14px)",
          opacity: m.halo,
          animation: `yangu-halo ${m.duration} ease-in-out infinite`,
        }}
      />
      <img
        src={glowBall}
        alt=""
        width={size}
        height={size}
        className="relative h-full w-full select-none object-contain"
        style={{ animation: `yangu-breathe ${m.duration} ease-in-out infinite`, ["--tw-scale-x" as string]: m.scale }}
        draggable={false}
      />
    </div>
  );
}
