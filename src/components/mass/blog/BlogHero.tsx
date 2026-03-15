interface BlogHeroProps {
  onSubscribeClick: () => void;
}

export function BlogHero({ onSubscribeClick }: BlogHeroProps) {
  return (
    <section className="flex flex-col items-center text-center px-6 pt-20 pb-2">
      {/* Headline */}
      <h1 className="mx-auto" style={{ maxWidth: 720 }}>
        <span className="text-white">The Only Subscription You Need</span>
        <br />
        <span className="text-white">to Stay at the Edge of AI</span>
      </h1>

      {/* Subtext */}
      <p className="mt-6 text-base md:text-xl" style={{ color: "rgba(255,255,255,0.5)", fontWeight: 400, lineHeight: 1.5 }}>
        Trusted by 100,000 builders
      </p>

      {/* CTA */}
      <button
        onClick={onSubscribeClick}
        className="mt-8 px-6 py-2.5 text-base md:text-lg font-semibold transition-all hover:brightness-110"
        style={{ background: "linear-gradient(90deg, #b5622a, #5c2a12)", color: "#fff", borderRadius: 12 }}
      >
        Subscribe
      </button>
    </section>
  );
}