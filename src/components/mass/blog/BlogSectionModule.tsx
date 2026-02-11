import { useRef, useEffect, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function BlogSectionModule({ title, subtitle, children }: Props) {
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
      <div className="mx-auto" style={{ maxWidth: 1100 }}>
        {/* Heading */}
        <div className="flex items-center justify-between mb-2">
          <h2
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.55)", letterSpacing: "0.15em" }}
          >
            {title}
          </h2>
          <ArrowRight
            className="w-4 h-4 transition-transform duration-200 hover:translate-x-0.5 cursor-pointer"
            style={{ color: "rgba(255,255,255,0.35)" }}
          />
        </div>

        {subtitle && (
          <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
            {subtitle}
          </p>
        )}

        {!subtitle && <div className="mb-8" />}

        {children}
      </div>
    </section>
  );
}
