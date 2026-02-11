import { podcastEpisodes } from "./blogData";
import { ArrowRight } from "lucide-react";
import { useRef, useEffect, useState } from "react";

export function BlogPodcastSection() {
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
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.55)", letterSpacing: "0.15em" }}
          >
            Podcast
          </h2>
          <ArrowRight className="w-4 h-4" style={{ color: "rgba(255,255,255,0.35)" }} />
        </div>

        {/* Podcast hero */}
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          <div
            className="w-40 h-40 rounded-2xl flex-shrink-0"
            style={{ background: "#1a1a1a" }}
          >
            <img src="/placeholder.svg" alt="AI & I Podcast" className="w-full h-full object-cover rounded-2xl" />
          </div>
          <div>
            <h3
              className="text-xl font-medium mb-2"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#fff" }}
            >
              AI & I
            </h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
              A podcast about the most important AI tools and ideas, hosted by Dan Shipper. New episodes weekly.
            </p>
            <div className="flex items-center gap-4">
              {["YouTube", "Spotify", "Apple"].map((p) => (
                <span key={p} className="text-xs px-3 py-1 rounded-full" style={{ background: "#222", color: "rgba(255,255,255,0.6)" }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Episodes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {podcastEpisodes.map((ep) => (
            <a key={ep.id} href="#" className="group block transition-all duration-200 hover:-translate-y-0.5" style={{ textDecoration: "none" }}>
              <div className="overflow-hidden rounded-lg mb-3" style={{ background: "#1a1a1a", aspectRatio: "16/9" }}>
                <img src={ep.image} alt={ep.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              </div>
              <span className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>
                Episode {ep.episode}
              </span>
              <h4
                className="text-sm font-medium leading-snug group-hover:text-white transition-colors"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "rgba(255,255,255,0.85)" }}
              >
                {ep.title}
              </h4>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                {ep.subtitle}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
