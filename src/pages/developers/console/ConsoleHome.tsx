import { useNavigate } from "react-router-dom";
import { Code, Send, Store, Shield, Activity, Layout, Cable } from "lucide-react";
import { DocsPage, DocsCard } from "@/components/developers/DocsPage";

export default function ConsoleHome() {
  const navigate = useNavigate();

  return (
    <DocsPage breadcrumb="Console" title="Developer Console" subtitle="Manage your apps, API keys, and App Store submissions.">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <DocsCard icon={Code} title="My Apps" description="Create and manage your developer applications." onClick={() => navigate("/developers/console/apps")} />
        <DocsCard icon={Send} title="Submissions" description="Track and manage your App Store submissions." onClick={() => navigate("/developers/console/submissions")} />
        <DocsCard icon={Store} title="App Store" description="Browse published apps in the marketplace." onClick={() => navigate("/developers/store")} />
      </div>
      <h2 className="text-lg font-semibold text-white mb-4">Runtime Management</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DocsCard icon={Shield} title="Permissions" description="Scopes and provider access." onClick={() => navigate("/developers/console/permissions")} />
        <DocsCard icon={Activity} title="Runtime" description="Rate limit rules." onClick={() => navigate("/developers/console/runtime")} />
        <DocsCard icon={Layout} title="Widgets" description="Widget registry." onClick={() => navigate("/developers/console/widgets")} />
        <DocsCard icon={Cable} title="Installs" description="Surface installs." onClick={() => navigate("/developers/console/installs")} />
      </div>
    </DocsPage>
  );
}