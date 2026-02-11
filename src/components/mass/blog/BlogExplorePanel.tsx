import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, ArrowRight } from "lucide-react";
import { exploreItems } from "./blogData";

export function BlogExplorePanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50" style={{ maxWidth: 320 }}>
      {/* Panel */}
      {open && (
        <div
          className="mb-3 rounded-xl overflow-hidden transition-all duration-[280ms] ease-out"
          style={{
            background: "#111",
            border: "1px solid rgba(255,255,255,0.1)",
            animation: "scale-in 0.28s ease-out",
          }}
        >
          <div className="p-4">
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "rgba(255,255,255,0.55)", letterSpacing: "0.12em" }}
            >
              Explore the Every Universe
            </h3>

            <div className="flex flex-col">
              {exploreItems.map((item, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex items-center gap-3 py-2.5 px-2 rounded-lg transition-colors hover:bg-white/5"
                  style={{ textDecoration: "none" }}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm flex-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {item.label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.25)" }} />
                </a>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="p-4 pt-2">
            <button
              className="w-full rounded-full py-2.5 text-sm font-medium transition-all hover:brightness-110"
              style={{ background: "#C5F0E0", color: "#111" }}
            >
              Create your free account →
            </button>
          </div>
        </div>
      )}

      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium transition-all hover:brightness-110"
        style={{
          background: "#222",
          color: "rgba(255,255,255,0.7)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        <span className="uppercase tracking-wider" style={{ letterSpacing: "0.1em" }}>
          Explore
        </span>
      </button>
    </div>
  );
}
