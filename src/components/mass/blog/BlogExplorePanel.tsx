import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
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
    <div ref={panelRef} className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50" style={{ maxWidth: "min(420px, calc(100vw - 32px))" }}>
      {open && (
        <div
          className="mb-3 overflow-hidden max-h-[70vh] overflow-y-auto"
          style={{
            background: "linear-gradient(180deg, #0f1f17 0%, #0a1710 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
          }}
        >
          {/* Header */}
          <button
            onClick={() => setOpen(false)}
            className="w-full flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.14em" }}
            >
              Explore the Every Universe
            </span>
            <ChevronDown className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
          </button>

          {/* Items */}
          <div className="px-3 py-2 flex flex-col">
            {exploreItems.map((item, i) => (
              <a
                key={i}
                href="#"
                className="group flex items-center justify-between gap-3 px-3 py-3 transition-colors"
                style={{
                  textDecoration: "none",
                  borderRadius: 8,
                  color: (item as any).muted ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.75)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = (item as any).muted ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.75)";
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-70" />
              </a>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="px-4 pb-4 pt-1">
            <button
              className="w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-110"
              style={{
                background: "transparent",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
              }}
            >
              Create your free account <span style={{ fontSize: 16 }}>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Trigger - positioned lower on mobile */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all hover:brightness-110"
          style={{
            background: "linear-gradient(180deg, #0f1f17 0%, #0a1710 100%)",
            color: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            letterSpacing: "0.1em",
          }}
        >
          Explore
        </button>
      )}
    </div>
  );
}