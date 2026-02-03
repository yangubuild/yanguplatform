import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useDomain } from "@/contexts/DomainContext";
import { useAuth } from "@/hooks/useAuth";

export function Hero() {
  const { routeConfig, domainType } = useDomain();
  const { isAuthenticated } = useAuth();

  // Domain-specific hero content
  const getHeroContent = () => {
    switch (domainType) {
      case "shop":
        return {
          badge: "Your own online storefront",
          heading: ["Launch Your", "Online Shop"],
          subheading: "Sell products directly to your customers. No middlemen, no platform fees on your sales.",
        };
      case "store":
        return {
          badge: "Digital goods & trading",
          heading: ["Trade &", "Exchange"],
          subheading: "List digital products, trade items, and manage your inventory with ease.",
        };
      case "studio":
        return {
          badge: "Showcase your work",
          heading: ["Present Your", "Portfolio"],
          subheading: "Display your services and creative work. Book clients directly from your own studio.",
        };
      case "community":
        return {
          badge: "Build together",
          heading: ["Grow Your", "Community"],
          subheading: "Create groups, share content, and engage with your audience on your own terms.",
        };
      case "live":
        return {
          badge: "Stream in real-time",
          heading: ["Go", "Live"],
          subheading: "Host live sessions, connect with your audience, and build real-time experiences.",
        };
      case "site":
        return {
          badge: "Your personal website",
          heading: ["Build Your", "Website"],
          subheading: "Create beautiful pages and share your story. Your domain, your content.",
        };
      default:
        return {
          badge: "Your own corner of the internet",
          heading: ["Own Your", "Digital Presence"],
          subheading: "Create independent public surfaces—shops, communities, portfolios, and more. You own the URL. Discovery is optional.",
        };
    }
  };

  const content = getHeroContent();

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      {/* Background glow effect */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-[120px]" />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-sm backdrop-blur-sm animate-fade-in">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-muted-foreground">{content.badge}</span>
          </div>

          {/* Main heading */}
          <h1 className="mb-6 animate-slide-up">
            <span className="block">{content.heading[0]}</span>
            <span className="text-gradient">{content.heading[1]}</span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
            {content.subheading}
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="accent" size="lg" className="group gap-2" asChild>
              <Link to={isAuthenticated ? routeConfig.defaultRoute : "/auth/signup"}>
                {routeConfig.primaryCta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            {routeConfig.secondaryCta && (
              <Button variant="outline" size="lg" asChild>
                <Link to={isAuthenticated ? routeConfig.defaultRoute : "#surfaces"}>
                  {routeConfig.secondaryCta}
                </Link>
              </Button>
            )}
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span>No coding required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span>Custom domains</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
