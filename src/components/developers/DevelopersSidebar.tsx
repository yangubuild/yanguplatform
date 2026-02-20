import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const sections = [
  {
    title: "Overview",
    items: [
      { label: "Build on Yangu", path: "/developers" },
      { label: "Quickstart", path: "/developers/quickstart" },
    ],
  },
  {
    title: "APIs",
    items: [
      { label: "REST & GraphQL", path: "/developers/apis/rest-graphql" },
      { label: "Authentication", path: "/developers/apis/authentication" },
      { label: "Webhooks", path: "/developers/apis/webhooks" },
      { label: "Data", path: "/developers/apis/data" },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "CLI", path: "/developers/tools/cli" },
      { label: "SDKs & Libraries", path: "/developers/tools/sdks" },
      { label: "Edge functions", path: "/developers/tools/edge-functions" },
    ],
  },
  {
    title: "Extensibility",
    items: [
      { label: "Apps & Extensions", path: "/developers/extensibility/apps" },
      { label: "Widgets & Embeds", path: "/developers/extensibility/widgets" },
      { label: "Providers", path: "/developers/extensibility/providers" },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      { label: "Custom domains", path: "/developers/infrastructure/custom-domains" },
      { label: "Environments", path: "/developers/infrastructure/environments" },
      { label: "Rate limits & Credits", path: "/developers/infrastructure/rate-limits-credits" },
      { label: "Logs & Status", path: "/developers/infrastructure/logs-status" },
      { label: "Changelog", path: "/developers/infrastructure/changelog" },
    ],
  },
  {
    title: "Console",
    items: [
      { label: "Developer Console", path: "/developers/console" },
      { label: "App Store", path: "/developers/store" },
    ],
  },
];

export function DevelopersSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-8">
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/90 text-sm font-semibold">Developers</span>
        <button
          onClick={() => navigate("/why-yangu")}
          className="text-white/40 hover:text-white/70 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="border-b border-white/10 mb-4" />

      {sections.map((section) => (
        <div key={section.title} className="mb-5">
          <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 px-1">
            {section.title}
          </h4>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors"
                    style={{
                      color: isActive ? "#F46D2A" : "rgba(255,255,255,0.55)",
                      background: isActive ? "rgba(244,109,42,0.08)" : "transparent",
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
