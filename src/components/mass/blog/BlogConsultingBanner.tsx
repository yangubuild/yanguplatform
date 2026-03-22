import { useRef, useEffect, useState } from "react";
import handshakeImg from "@/assets/blog/handshake.png";

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
        transform: visible ? "translateY(0)" : "translateY(8px)" }}>
      <div
        className="mx-auto rounded-2xl overflow-hidden relative flex flex-col md:flex-row items-center justify-between gap-8"
        style={{
          maxWidth: 1100,
          background: "linear-gradient(135deg, #0A1710 0%, #174638 40%, #15261F 70%, #0A1710 100%)",
          minHeight: 220 }}>
        {/* Subtle radial bloom */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 30% 50%, rgba(41, 96, 72, 0.28), transparent 70%)" }}
        />

        <div className="flex-1 relative z-10 p-10">
          <h2
            className="text-2xl font-medium mb-3 leading-tight"
            style={{ fontFamily: "'Lufga', sans-serif" }}>
            Stop Planning Your AI Strategy. Start <span style={{ fontStyle: "italic" }}>E</span>xecuting It.
          </h2>
          <p className="text-sm mb-6 text-muted-foreground">
            Work with our team to build and ship AI-powered products and workflows for your organization.
          </p>
          <button
            className="rounded-lg px-6 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
            style={{
              background: "linear-gradient(90deg, #b5622a, #5c2a12)" }}>
            Learn more
          </button>
        </div>

        {/* Handshake image */}
        <div className="relative z-10 flex-shrink-0 w-[280px] md:w-[340px] self-end">
          <img
            src={handshakeImg}
            alt="Human and AI handshake"
            className="w-full h-auto object-contain opacity-80"
            style={{ filter: "invert(1) brightness(0.7)" }}
          />
        </div>
      </div>
    </section>
  );
}
