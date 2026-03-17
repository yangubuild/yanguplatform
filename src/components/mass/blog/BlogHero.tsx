import { T } from "@/lib/typography";

interface BlogHeroProps {
  onSubscribeClick: () => void;
}

export function BlogHero({ onSubscribeClick }: BlogHeroProps) {
  return (
    <section className="flex flex-col items-center text-center px-6 pt-12 pb-2">
      {/* Headline */}
      <h2
        className={`mx-auto ${T.header}`}
        style={{
          fontFamily: "'Lufga', sans-serif",
          color: "#FFFFFF",
          maxWidth: 720,
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
      <Button
        variant="accent"
        size="default"
        onClick={onSubscribeClick}
        className="mt-8"
      >
        Subscribe
      </Button>
    </section>
  );
}
