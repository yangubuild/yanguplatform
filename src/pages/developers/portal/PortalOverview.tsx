import { useNavigate } from "react-router-dom";
import { Code, Key, CreditCard, BookOpen } from "lucide-react";
import { DocsPage, DocsCard } from "@/components/developers/DocsPage";

export default function PortalOverview() {
  const navigate = useNavigate();

  return (
    <DocsPage breadcrumb="Portal" title="Developer Overview" subtitle="Manage your apps, keys, and integrations from one place.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DocsCard icon={Code} title="My Apps" description="Create, configure, and manage your developer applications." onClick={() => navigate("/developers/portal/apps")} />
        <DocsCard icon={Key} title="API Keys" description="Generate and manage API keys for your apps." onClick={() => navigate("/developers/portal/api-keys")} />
        <DocsCard icon={CreditCard} title="Billing" description="Free during beta — no card required." onClick={() => navigate("/developers/portal/billing")} />
        <DocsCard icon={BookOpen} title="Documentation" description="Explore the full developer docs and API reference." onClick={() => navigate("/developers")} />
      </div>
    </DocsPage>
  );
}
