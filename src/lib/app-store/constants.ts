// YANGU App Store — Seed Constants & Category Registry

export const YANGU_PROVIDER = {
  name: "YANGU",
  type: "platform",
  badgeLogo: "/yangu-logo.svg", // swap with real asset path
} as const;

export const CATEGORIES = [
  { slug: "yangu-native", name: "YANGU Native" },
  { slug: "business", name: "Business" },
  { slug: "finance", name: "Finance" },
  { slug: "productivity", name: "Productivity" },
  { slug: "communication", name: "Communication" },
  { slug: "commerce", name: "Commerce" },
  { slug: "ai-tools", name: "AI Tools" },
  { slug: "connectors", name: "Connectors" },
  { slug: "education", name: "Education" },
  { slug: "marketing", name: "Marketing" },
  { slug: "hr", name: "HR" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
