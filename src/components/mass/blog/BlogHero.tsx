interface BlogHeroProps {
  onSubscribeClick: () => void;
}

export function BlogHero({ onSubscribeClick }: BlogHeroProps) {
  return (
    <section className="flex flex-col items-center text-center px-6 pt-16 pb-12">
      {/* Logo */}
      <h1
        className="tracking-wide"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "clamp(2.5rem, 5vw, 4rem)",
          fontWeight: 400,
          color: "#FFFFFF",
          letterSpacing: "0.15em",
        }}
      >
        EVERY
      </h1>

      {/* Divider */}
      <div className="w-16 mt-6 mb-10" style={{ height: 1, background: "rgba(255,255,255,0.2)" }} />

      {/* Headline */}
      <h2
        className="mx-auto leading-tight"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
          fontWeight: 400,
          color: "#FFFFFF",
          maxWidth: 700,
          lineHeight: 1.2,
        }}
      >
        The Only Subscription You Need to Stay at the Edge of AI
      </h2>

      {/* Subtext */}
      <p className="mt-5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
        Trusted by 100,000 builders
      </p>

      {/* CTA */}
      <button
        onClick={onSubscribeClick}
        className="mt-8 rounded-full px-8 py-3 text-sm font-medium transition-all hover:brightness-110"
        style={{ background: "#C5F0E0", color: "#111" }}
      >
        Subscribe
      </button>
    </section>
  );
}
