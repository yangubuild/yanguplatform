import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Code, Database, Webhook, Terminal, Layers, Shield, Cpu, Globe, Puzzle,
  Building2, Server, Store,
} from "lucide-react";
import { DocsPage, DocsSection, DocsCard } from "@/components/developers/DocsPage";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { DeveloperAuthModal } from "@/components/developers/DeveloperAuthModal";

const devCards = [
  { icon: Code, title: "REST & GraphQL", description: "Access every platform feature through well-documented APIs.", path: "/developers/apis/rest-graphql" },
  { icon: Database, title: "Data", description: "Direct access to your data layer with row-level security built in.", path: "/developers/apis/data" },
  { icon: Webhook, title: "Webhooks", description: "Real-time event notifications for payments, signups, and more.", path: "/developers/apis/webhooks" },
  { icon: Terminal, title: "CLI tools", description: "Manage your projects from the command line with our developer toolkit.", path: "/developers/tools/cli" },
  { icon: Layers, title: "SDKs & Libraries", description: "Official client libraries for JavaScript, Python, and more.", path: "/developers/tools/sdks" },
  { icon: Shield, title: "Authentication", description: "Integrate OAuth, magic links, and SSO into your application.", path: "/developers/apis/authentication" },
  { icon: Cpu, title: "Edge functions", description: "Run serverless functions close to your users with zero cold starts.", path: "/developers/tools/edge-functions" },
  { icon: Globe, title: "Custom domains", description: "Map your own domains and manage DNS programmatically.", path: "/developers/infrastructure/custom-domains" },
  { icon: Puzzle, title: "Apps & Extensions", description: "Extend the platform with installable apps and plugins.", path: "/developers/extensibility/apps" },
];

const agencyCards = [
  { icon: Building2, title: "Multi-tenant apps", description: "Build white-label products on top of the yangu platform for your clients.", path: "/developers/extensibility/apps" },
  { icon: Server, title: "Environments", description: "Dev, staging, and production environments with isolated data.", path: "/developers/infrastructure/environments" },
];

export default function DevelopersHome() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const handleAddApp = () => {
    if (isAuthenticated) {
      navigate("/developers/portal/apps?new=1");
    } else {
      setShowAuth(true);
    }
  };

  return (
    <DocsPage
      breadcrumb="Overview"
      title="Build on yangu"
      subtitle="Everything you need to build, integrate, and scale on the yangu platform.">
      {/* CTA Buttons */}
      <div className="flex flex-wrap gap-3 mb-10">
        <Button variant="accent" onClick={handleAddApp}>
          Create Developer App
        </Button>
        <Button
          variant="ghost"
          className="text-muted-foreground border border-white/12 hover:bg-white/5"
          onClick={() => navigate("/developers/apis/rest-graphql")}>
          View API Reference
        </Button>
      </div>

      <DocsSection id="for-developers" title="For developers" description="Explore tools and APIs to build on yangu:">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devCards.map((card) => (
            <DocsCard key={card.title} icon={card.icon} title={card.title} description={card.description} onClick={() => navigate(card.path)} />
          ))}
        </div>
      </DocsSection>

      <DocsSection id="for-agencies" title="For agencies & builders" description="Build products and workflows on top of yangu:">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {agencyCards.map((card) => (
            <DocsCard key={card.title} icon={card.icon} title={card.title} description={card.description} onClick={() => navigate(card.path)} />
          ))}
        </div>
      </DocsSection>

      <DocsSection id="app-store" title="App Store" description="Browse and submit apps to the yangu marketplace:">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DocsCard icon={Store} title="Browse App Store" description="Discover apps built by the community and verified by yangu." onClick={() => navigate("/developers/store")} />
          <DocsCard icon={Puzzle} title="Submit an App" description="Package your integration and publish it to the yangu App Store." onClick={() => navigate("/developers/console/submissions/new")} />
        </div>
      </DocsSection>

      <DeveloperAuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        returnTo="/developers/portal/apps?new=1"
        onSuccess={() => {
          setShowAuth(false);
          navigate("/developers/portal/apps?new=1");
        }}
      />
    </DocsPage>
  );
}
