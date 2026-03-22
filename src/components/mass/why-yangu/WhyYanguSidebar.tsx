import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { Audience } from "./AudienceToggle";
import { DocsTypography } from "./docs-typography";

const builderSections = [
  {
    title: "Overview",
    items: [
      { label: "Build on yangu", id: "build-on-yangu", active: true },
    ],
  },
  {
    title: "Features",
    items: [
      { label: "Community", id: "community" },
      { label: "Shop", id: "shop" },
      { label: "Payments", id: "payments" },
      { label: "Studio", id: "studio" },
      { label: "Live", id: "live" },
      { label: "Site", id: "site" },
      { label: "Custom domains", id: "domains" },
      { label: "Ads & Trends", id: "ads" },
    ],
  },
];

const developerSections = [
  {
    title: "Overview",
    items: [
      { label: "Build on yangu", id: "build-on-yangu", active: true },
      { label: "Getting started", id: "getting-started" },
    ],
  },
  {
    title: "APIs",
    items: [
      { label: "REST & GraphQL", id: "rest-graphql" },
      { label: "Authentication", id: "authentication" },
      { label: "Webhooks", id: "webhooks" },
      { label: "Database access", id: "database-access" },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "CLI tools", id: "cli-tools" },
      { label: "SDKs & Libraries", id: "sdks" },
      { label: "Edge functions", id: "edge-functions" },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      { label: "Custom domains", id: "custom-domains" },
      { label: "Plugins & extensions", id: "plugins" },
    ],
  },
];

interface WhyYanguSidebarProps {
  audience: Audience;
}

export function WhyYanguSidebar({ audience }: WhyYanguSidebarProps) {
  const sections = audience === "builders" ? builderSections : developerSections;
  const [activeId, setActiveId] = useState(sections[0]?.items[0]?.id ?? "");

  return (
    <nav className="sticky top-8">
      <div className="flex items-center justify-between mb-4">
        <span className={DocsTypography.sidebarHeader}>Getting Started</span>
        <button className="text-muted-foreground hover:text-muted-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="border-b border-white/10 mb-4" />

      {sections.map((section) => (
        <div key={section.title} className={DocsTypography.sidebarSection}>
          <h4 className={DocsTypography.sidebarSectionLabel}>
            {section.title}
          </h4>
          <ul className={DocsTypography.sidebarLinkList}>
            {section.items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveId(item.id)}
                  className={DocsTypography.sidebarLink}
                  style={{
                    color: activeId === item.id ? "#F46D2A" : "rgba(255,255,255,0.55)",
                    background: activeId === item.id ? "rgba(244,109,42,0.08)" : "transparent",
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
