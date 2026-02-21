import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { DocsTypography } from "./docs-typography";

const devCards = [
  { icon: Code, title: "REST & GraphQL APIs", description: "Access every platform feature through well-documented APIs.", path: "/developers/apis/rest-graphql" },
  { icon: Database, title: "Database access", description: "Direct access to your data layer with row-level security built in.", path: "/developers/apis/data" },
  { icon: Webhook, title: "Webhooks", description: "Real-time event notifications for payments, signups, and more.", path: "/developers/apis/webhooks" },
  { icon: Terminal, title: "CLI tools", description: "Manage your projects from the command line with our developer toolkit.", path: "/developers/tools/cli" },
  { icon: Layers, title: "SDKs & Libraries", description: "Official client libraries for JavaScript, Python, and more.", path: "/developers/tools/sdks" },
  { icon: Shield, title: "Authentication", description: "Integrate OAuth, magic links, and SSO into your application.", path: "/developers/apis/authentication" },
  { icon: Cpu, title: "Edge functions", description: "Run serverless functions close to your users with zero cold starts.", path: "/developers/tools/edge-functions" },
  { icon: Globe, title: "Custom domains", description: "Map your own domains and manage DNS programmatically.", path: "/developers/infrastructure/custom-domains" },
  { icon: Puzzle, title: "Plugins & extensions", description: "Extend platform functionality with custom plugins and integrations.", path: "/developers/extensibility/apps" },
];

export function WhyYanguDevelopersContent() {
  const navigate = useNavigate();

  return (
    <div>
      <p className={DocsTypography.pageKicker} style={{ color: "rgba(255,255,255,0.4)" }}>
        Overview
      </p>

      <h1 className={DocsTypography.h1}>Build on Yangu</h1>

      <p className={DocsTypography.subtitle} style={{ color: "rgba(255,255,255,0.5)" }}>
        Everything you need to build, integrate, and scale on the Yangu platform.
      </p>

      <div className="flex flex-wrap gap-3 mb-10">
        <Button variant="accent" onClick={() => navigate("/developers")}>
          Open Developer Docs
        </Button>
        <Button variant="accent" onClick={() => navigate("/developers/console")}>
          Developer Console
        </Button>
      </div>

      <div id="for-developers" className="mb-6">
        <h2 className={DocsTypography.h2}>For developers</h2>
        <p className={DocsTypography.sectionDesc} style={{ color: "rgba(255,255,255,0.5)" }}>
          Explore tools and APIs to build on Yangu:
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {devCards.map((card) => (
          <div
            key={card.title}
            onClick={() => navigate(card.path)}
            className="rounded-xl p-5 transition-colors cursor-pointer hover:border-white/20"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <card.icon className="w-6 h-6 mb-4" strokeWidth={1.5} style={{ color: "#F46D2A" }} />
            <h3 className="text-white font-semibold text-sm mb-2">{card.title}</h3>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div className="hidden xl:block fixed right-8 top-32">
        <div className="text-white/40 text-xs font-medium flex items-center gap-2 mb-3">
          <span className="text-white/30">≡</span> On this page
        </div>
        <a href="#for-developers" className="text-xs block" style={{ color: "#F46D2A" }}>
          For developers
        </a>
      </div>
    </div>
  );
}
