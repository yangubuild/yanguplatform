import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ShoppingBag,
  Palette,
  Radio,
  Globe,
  Link,
  TrendingUp,
  Check,
} from "lucide-react";
import { DocsTypography } from "./docs-typography";
import { Button } from "@/components/ui/button";
import { BuilderSetupDrawer } from "./BuilderSetupDrawer";

export interface BuilderFeature {
  key: string;
  icon: React.ElementType;
  title: string;
  description: string;
  docsPath: string;
}

export const BUILDER_FEATURES: BuilderFeature[] = [
  { key: "community", icon: Users, title: "Community", description: "Launch groups, enable explore visibility, and grow a loyal audience.", docsPath: "/developers/docs/builders/community" },
  { key: "shop", icon: ShoppingBag, title: "Shop", description: "Sell physical or digital products with built-in checkout.", docsPath: "/developers/docs/builders/shop" },
  { key: "studio", icon: Palette, title: "Studio", description: "Create ads, images, and branded content with AI tools.", docsPath: "/developers/docs/builders/studio" },
  { key: "live", icon: Radio, title: "Live", description: "Go live and sell in real time to your audience.", docsPath: "/developers/docs/builders/live" },
  { key: "site", icon: Globe, title: "Site", description: "Build service pages, portfolios, and real estate listings.", docsPath: "/developers/docs/builders/site" },
  { key: "domains", icon: Link, title: "Custom domains", description: "Use your own domain for a professional online presence.", docsPath: "/developers/docs/builders/domains" },
  { key: "ads", icon: TrendingUp, title: "Ads & Trends", description: "Boost visibility with promoted placements and trend features.", docsPath: "/developers/docs/builders/ads" },
];

export function WhyYanguContent() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div>
      <p className={DocsTypography.pageKicker} className="text-muted-foreground">
        Overview
      </p>

      <h1 className={DocsTypography.h1}>Build your business on yangu</h1>
      <p className={DocsTypography.subtitle} className="text-muted-foreground">
        No code required. Pick the features you need, and we'll set everything up for you.
      </p>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {BUILDER_FEATURES.map((f) => {
          const isSelected = selected.has(f.key);
          return (
            <div
              key={f.key}
              className="rounded-xl p-5 transition-all cursor-pointer relative group"
              style={{
                background: isSelected ? "rgba(244,109,42,0.08)" : "rgba(255,255,255,0.03)",
                border: isSelected ? "1px solid rgba(244,109,42,0.4)" : "1px solid rgba(255,255,255,0.10)",
              }}
              onClick={() => toggle(f.key)}
            >
              {/* Selection indicator */}
              <div
                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: isSelected ? "#F46D2A" : "rgba(255,255,255,0.08)",
                  border: isSelected ? "none" : "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {isSelected && <Check className="w-3 h-3 text-foreground" />}
              </div>

              <f.icon className="w-6 h-6 mb-4" strokeWidth={1.5} style={{ color: "#F46D2A" }} />
              <h3 className="text-foreground font-semibold text-sm mb-2">{f.title}</h3>
              <p className="text-xs leading-relaxed mb-3 text-muted-foreground">
                {f.description}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(f.docsPath);
                }}
                className="text-xs font-medium transition-colors"
                style={{ color: "#F46D2A" }}
              >
                Learn more →
              </button>
            </div>
          );
        })}
      </div>

      {/* Continue CTA */}
      {selected.size > 0 && (
        <div
          className="sticky bottom-4 flex items-center justify-between rounded-xl px-6 py-4 z-20"
          style={{
            background: "rgba(10, 23, 16, 0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <span className="text-muted-foreground text-sm">
            {selected.size} feature{selected.size > 1 ? "s" : ""} selected
          </span>
          <Button variant="accent" onClick={() => setDrawerOpen(true)}>
            Continue
          </Button>
        </div>
      )}

      <BuilderSetupDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedKeys={selected}
      />
    </div>
  );
}
