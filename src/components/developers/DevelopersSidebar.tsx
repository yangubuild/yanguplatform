import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { DocsTypography } from "@/components/mass/why-yangu/docs-typography";
import { useAuth } from "@/hooks/useAuth";
import { DeveloperAuthModal } from "./DeveloperAuthModal";

const sections = [
  {
    title: "Overview",
    items: [
      { label: "Build on yangu", path: "/developers" },
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
      { label: "Developer Console", path: "/developers/console", requiresAuth: true },
      { label: "App Store", path: "/developers/store" },
    ],
  },
];

export function DevelopersSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const handleClick = (item: { path: string; requiresAuth?: boolean }) => {
    if (item.requiresAuth && !isAuthenticated) {
      setShowAuth(true);
      return;
    }
    navigate(item.path);
  };

  return (
    <nav className="sticky top-8">
      <div className="flex items-center justify-between mb-4">
        <span className={DocsTypography.sidebarHeader}>Developers</span>
        <button
          onClick={() => navigate("/why-yangu")}
          className="text-white/40 hover:text-white/70 transition-colors"
        >
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
            {section.items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => handleClick(item)}
                    className={DocsTypography.sidebarLink}
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

      <DeveloperAuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        returnTo="/developers/console"
        onSuccess={() => {
          setShowAuth(false);
          navigate("/developers/console");
        }}
      />
    </nav>
  );
}
