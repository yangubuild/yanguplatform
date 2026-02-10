import {
  Code,
  Database,
  Webhook,
  Terminal,
  Layers,
  Shield,
  Cpu,
  Globe,
  Puzzle,
} from "lucide-react";

const devCards = [
  {
    icon: Code,
    title: "REST & GraphQL APIs",
    description: "Access every platform feature through well-documented APIs.",
  },
  {
    icon: Database,
    title: "Database access",
    description: "Direct access to your data layer with row-level security built in.",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description: "Real-time event notifications for payments, signups, and more.",
  },
  {
    icon: Terminal,
    title: "CLI tools",
    description: "Manage your projects from the command line with our developer toolkit.",
  },
  {
    icon: Layers,
    title: "SDKs & Libraries",
    description: "Official client libraries for JavaScript, Python, and more.",
  },
  {
    icon: Shield,
    title: "Authentication",
    description: "Integrate OAuth, magic links, and SSO into your application.",
  },
  {
    icon: Cpu,
    title: "Edge functions",
    description: "Run serverless functions close to your users with zero cold starts.",
  },
  {
    icon: Globe,
    title: "Custom domains",
    description: "Map your own domains and manage DNS programmatically.",
  },
  {
    icon: Puzzle,
    title: "Plugins & extensions",
    description: "Extend platform functionality with custom plugins and integrations.",
  },
];

export function WhyYanguDevelopersContent() {
  return (
    <div>
      {/* Breadcrumb */}
      <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
        Overview
      </p>

      {/* Title */}
      <h1 className="text-3xl font-bold text-white mb-3">Build on Yangu</h1>

      {/* Subtitle */}
      <p className="text-base mb-10" style={{ color: "rgba(255,255,255,0.5)" }}>
        Everything you need to build, integrate, and scale on the Yangu platform.
      </p>

      {/* Section */}
      <div id="for-developers" className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">For developers</h2>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
          Explore tools and APIs to build on Yangu:
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {devCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl p-5 transition-colors cursor-pointer hover:border-white/20"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <card.icon
              className="w-6 h-6 mb-4"
              strokeWidth={1.5}
              style={{ color: "#F46D2A" }}
            />
            <h3 className="text-white font-semibold text-sm mb-2">{card.title}</h3>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* On this page sidebar anchor */}
      <div className="hidden xl:block fixed right-8 top-32">
        <div className="text-white/40 text-xs font-medium flex items-center gap-2 mb-3">
          <span className="text-white/30">≡</span> On this page
        </div>
        <a
          href="#for-developers"
          className="text-xs block"
          style={{ color: "#F46D2A" }}
        >
          For developers
        </a>
      </div>
    </div>
  );
}
