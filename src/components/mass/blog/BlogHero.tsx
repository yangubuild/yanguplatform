import yanguLogo from "@/assets/yangu-logo-blog.png";

interface BlogHeroProps {
  onSubscribeClick: () => void;
}

export function BlogHero({ onSubscribeClick }: BlogHeroProps) {
  return (
    <section className="flex flex-col items-center text-center px-6 pt-20 pb-2">
      {/* Logo */}
      <img src={yanguLogo} alt="Yangu" className="h-16 w-auto" />

      {/* Divider */}
      <div className="w-16 mt-8 mb-14" style={{ height: 1, background: "rgba(255,255,255,0.2)" }} />

      {/* Headline */}
      <h2
        className="mx-auto"
        style={{
          fontFamily: "'Lufga', sans-serif",
          fontSize: "clamp(2rem, 4vw, 3.2rem)",
          fontWeight: 400,
          color: "#FFFFFF",
          maxWidth: 720,
          lineHeight: 1.15,
        }}
      >
        The Only Subscription You Need
        <br />
        to Stay at the Edge of AI
      </h2>

      {/* Subtext */}
      <p className="mt-6 text-base" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.02em" }}>
        Trusted by 100,000 builders
      </p>

      {/* CTA */}
      <button
        onClick={onSubscribeClick}
        className="mt-8 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
        style={{ background: "linear-gradient(90deg, #b5622a, #5c2a12)", color: "#fff" }}
      >
        Subscribe
      </button>
    </section>
  );
}
