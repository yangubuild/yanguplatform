import { BlogArticleCard } from "./BlogArticleCard";
import { columnistArticles } from "./blogData";
import { useRef, useEffect, useState } from "react";

export function BlogColumnistBlock() {
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
        <h2
          className="text-xs font-semibold uppercase tracking-widest mb-8"
          style={{ color: "rgba(255,255,255,0.55)", letterSpacing: "0.15em" }}
        >
          From Our Columnists
        </h2>

        {/* Spotlight */}
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"
            alt="Dan Shipper"
            className="w-24 h-24 rounded-full flex-shrink-0 object-cover"
          />
          <div>
            <h3
              className="text-lg font-medium mb-1"
              style={{ fontFamily: "'Lufga', sans-serif", color: "#fff" }}
            >
              Dan Shipper
            </h3>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>
              Co-founder and CEO of Every. Writes about AI, productivity, and building products. Previously founded Firefly and co-founded Ether.
            </p>
            <a
              href="#"
              className="text-xs font-medium transition-colors hover:text-foreground"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Read more →
            </a>
          </div>
        </div>

        {/* Articles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columnistArticles.map((a) => (
            <BlogArticleCard key={a.id} article={a} />
          ))}
        </div>
      </div>
    </section>
  );
}
