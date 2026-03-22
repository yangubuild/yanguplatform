import { podcastEpisodes, podcastHeroImage } from "./blogData";
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
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ letterSpacing: "0.15em" }}
          >
            yangu Podcast
          </h2>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>

        <div className="mb-8" style={{ borderTop: "1px dashed rgba(255,255,255,0.15)" }} />

        {/* 4-column grid like reference: hero + 3 episodes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Hero card */}
          <a href="#" className="group block transition-all duration-200 hover:-translate-y-0.5" style={{ textDecoration: "none" }}>
            <div className="overflow-hidden rounded-lg mb-4" style={{ background: "#1a1a1a", aspectRatio: "3/4" }}>
              <img src={podcastHeroImage} alt="AI & I Podcast" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ fontFamily: "'Lufga', sans-serif", }}>
              AI & I
            </h3>
            <p className="text-sm leading-relaxed mb-3 text-muted-foreground">
              Every week, Dan sits down with the smartest people in tech and explores the possibilities of AI together.
            </p>
            <div className="flex items-center gap-3">
              {["▶️", "🎧", "🎙️"].map((icon, i) => (
                <span key={i} className="text-lg opacity-60 hover:opacity-100 transition-opacity">{icon}</span>
              ))}
            </div>
          </a>

          {/* Episode cards */}
          {podcastEpisodes.map((ep) => (
            <a key={ep.id} href="#" className="group block transition-all duration-200 hover:-translate-y-0.5" style={{ textDecoration: "none" }}>
              <div className="overflow-hidden rounded-lg mb-4" style={{ background: "#1a1a1a", aspectRatio: "3/4" }}>
                <img src={ep.image} alt={ep.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              </div>
              <span className="text-xs mb-1 block text-muted-foreground">
                Episode {ep.episode}
              </span>
              <h4
                className="font-medium leading-snug group-hover:text-foreground transition-colors"
                style={{ fontFamily: "'Lufga', sans-serif", fontSize: 18, }}
              >
                {ep.title}
              </h4>
              <p className="text-sm mt-2 leading-relaxed text-muted-foreground">
                {ep.subtitle}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
