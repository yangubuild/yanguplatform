import { Shield, Zap, Globe, BarChart3, Palette, Lock } from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Your URL, Your Rules",
    description: "Get a permanent URL that you control. No algorithms deciding who sees your content.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data stays yours. We don't sell or share your information with third parties.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built on modern infrastructure. Your surfaces load instantly, anywhere in the world.",
  },
  {
    icon: BarChart3,
    title: "Analytics Built In",
    description: "Understand your audience with privacy-respecting analytics. No third-party trackers.",
  },
  {
    icon: Palette,
    title: "Fully Customizable",
    description: "Make it yours with custom themes, fonts, and layouts. Express your unique style.",
  },
  {
    icon: Lock,
    title: "Explore Optional",
    description: "Choose visibility. Get discovered on the platform marketplace, or stay private.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-32 bg-surface-sunken/50">
      <div className="container">
        {/* Section header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4">
            Built for <span className="text-gradient">Independence</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to establish and grow your digital presence, 
            without compromising on ownership or privacy.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-accent/50 hover:shadow-lg"
              style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
