import { useState, useRef, useEffect } from "react";
import { ChevronUp, Check } from "lucide-react";

const audiences = [
  { label: "For Builders", value: "builders" },
  { label: "For Developers", value: "developers" },
] as const;

export type Audience = (typeof audiences)[number]["value"];

interface AudienceToggleProps {
  value: Audience;
  onChange: (value: Audience) => void;
}

export function AudienceToggle({ value, onChange }: AudienceToggleProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = audiences.find((a) => a.value === value)!;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)", }}
      >
        {current.label}
        <ChevronUp
          className="w-3.5 h-3.5 transition-transform"
          style={{ transform: open ? "rotate(0deg)" : "rotate(180deg)" }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-48 rounded-xl py-2 z-50"
          style={{
            background: "rgba(10, 23, 16, 0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {audiences.map((a) => (
            <button
              key={a.value}
              onClick={() => {
                onChange(a.value);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors hover:bg-white/5"
              style={{
                color: a.value === value ? "#F46D2A" : "rgba(255,255,255,0.7)",
              }}
            >
              {a.label}
              {a.value === value && <Check className="w-4 h-4" style={{ color: "#F46D2A" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
