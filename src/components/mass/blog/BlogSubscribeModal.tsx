import { useState, useEffect, useRef, useCallback } from "react";
import { X, Check } from "lucide-react";

const LS_KEY = "every_subscribe_modal_last_shown";

function wasShownToday(): boolean {
  const last = localStorage.getItem(LS_KEY);
  if (!last) return false;
  const d = new Date(last);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function markShown() {
  localStorage.setItem(LS_KEY, new Date().toISOString());
}

const checklist = [
  "In-depth reviews of the latest AI tools",
  "Playbooks for integrating AI into your work",
  "Insights from top AI builders and thinkers",
  "Access to Spiral, Cora, Sparkle, and Monologue",
];

export function BlogSubscribeModal() {
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggered = useRef(false);

  const close = useCallback(() => {
    setOpen(false);
    markShown();
  }, []);

  // Auto-trigger
  useEffect(() => {
    if (wasShownToday()) return;

    // Time trigger
    const timer = setTimeout(() => {
      if (!triggered.current) {
        triggered.current = true;
        setOpen(true);
      }
    }, 10000);

    // Scroll trigger
    const onScroll = () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (pct >= 0.35 && !triggered.current) {
        triggered.current = true;
        setOpen(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, close]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const el = modalRef.current;
    if (el) {
      const focusable = el.querySelectorAll<HTMLElement>("button, input, a, [tabindex]");
      if (focusable.length > 0) focusable[0].focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        ref={modalRef}
        className="relative w-full rounded-2xl overflow-hidden flex flex-col md:flex-row"
        style={{
          maxWidth: 820,
          animation: "scale-in 0.28s ease-out",
        }}
      >
        {/* Close */}
        <button
          onClick={close}
          className="absolute top-4 right-4 z-10 p-1 rounded-full transition-colors hover:bg-black/10"
          style={{ color: "#666" }}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left — white */}
        <div className="flex-1 p-8 md:p-10" style={{ background: "#FFFFFF" }}>
          <h2
            className="text-xl md:text-2xl font-medium leading-tight mb-2"
            style={{ fontFamily: "'Lufga', sans-serif", color: "#111" }}
          >
            The Only Subscription You Need to Stay at the Edge of AI
          </h2>
          <p className="text-sm mb-6" style={{ color: "#666" }}>
            Join 100,000+ builders who read Every.
          </p>

          <ul className="space-y-3 mb-6">
            {checklist.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#22c55e" }} />
                <span className="text-sm" style={{ color: "#333" }}>{item}</span>
              </li>
            ))}
          </ul>

          <input
            type="email"
            placeholder="Your email address"
            className="w-full rounded-lg border px-4 py-2.5 text-sm mb-3 outline-none focus:ring-2 focus:ring-emerald-300"
            style={{ borderColor: "#ddd", color: "#111" }}
          />
          <button
            className="w-full rounded-lg py-2.5 text-sm font-medium transition-all hover:brightness-95"
            style={{ background: "#111", color: "#fff" }}
          >
            Unlock the Every universe
          </button>
          <button
            onClick={close}
            className="w-full mt-3 text-xs text-center transition-colors hover:text-black"
            style={{ color: "#999" }}
          >
            Maybe later
          </button>
        </div>

        {/* Right — warm bg */}
        <div
          className="hidden md:flex flex-col items-center justify-center p-8"
          style={{ background: "#F5E6D3", width: "45%" }}
        >
          <span
            className="text-xs font-medium px-3 py-1 rounded-full mb-6"
            style={{ background: "rgba(0,0,0,0.08)", color: "#555" }}
          >
            Included in your subscription
          </span>
          <div
            className="w-full rounded-xl overflow-hidden"
            style={{ background: "#e8d5c0", aspectRatio: "4/3" }}
          >
            <img src="/placeholder.svg" alt="Products" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
}
