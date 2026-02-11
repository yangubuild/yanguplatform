import { useRef, useEffect, useState } from "react";

export function BlogConsultingBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="px-6 py-10 transition-all duration-[400ms] ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
      }}
    >
      <div
        className="mx-auto rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between gap-8"
        style={{ maxWidth: 1100, background: "#111" }}
      >
        <div className="flex-1">
          <h2
            className="text-2xl font-medium mb-3 leading-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#fff" }}
          >
            Stop Planning Your AI Strategy. Start Executing It.
          </h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.55)" }}>
            Work with our team to build and ship AI-powered products and workflows for your organization.
          </p>
          <button
            className="rounded-full px-6 py-2.5 text-sm font-medium transition-all hover:brightness-110"
            style={{ background: "#C5F0E0", color: "#111" }}
          >
            Learn more
          </button>
        </div>
        <div className="w-32 h-32 flex-shrink-0 flex items-center justify-center text-6xl">
          🤝
        </div>
      </div>
    </section>
  );
}
