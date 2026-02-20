import { useLocation } from "react-router-dom";
import { DocsPage, PlaceholderBlock } from "@/components/developers/DocsPage";

const pageConfig: Record<string, { breadcrumb: string; title: string; subtitle: string; sections: { title: string; items: string[] }[] }> = {
  "/developers/apis/rest-graphql": {
    breadcrumb: "APIs",
    title: "REST & GraphQL",
    subtitle: "Access the Yangu platform through a unified API layer.",
    sections: [
      { title: "REST API", items: ["Base URL and versioning", "Authentication headers", "Pagination and filtering", "Rate limiting"] },
      { title: "GraphQL", items: ["Schema explorer", "Queries and mutations", "Subscriptions for real-time data", "Introspection endpoint"] },
    ],
  },
  "/developers/apis/authentication": {
    breadcrumb: "APIs",
    title: "Authentication",
    subtitle: "Secure your integrations with OAuth 2.0, API keys, and session tokens.",
    sections: [
      { title: "OAuth 2.0 flows", items: ["Authorization code grant", "PKCE for SPAs", "Client credentials for server-to-server", "Token refresh and revocation"] },
      { title: "API key authentication", items: ["Key generation and rotation", "Environment-scoped keys (dev/prod)", "Key prefix format and best practices"] },
    ],
  },
  "/developers/apis/webhooks": {
    breadcrumb: "APIs",
    title: "Webhooks",
    subtitle: "Receive real-time notifications when events happen on the platform.",
    sections: [
      { title: "Webhook management", items: ["Register and configure endpoints", "Event type catalog", "Signature verification", "Retry policy and delivery logs"] },
    ],
  },
  "/developers/apis/data": {
    breadcrumb: "APIs",
    title: "Data Access",
    subtitle: "Direct database access with row-level security and real-time subscriptions.",
    sections: [
      { title: "Data layer", items: ["Row-level security policies", "Real-time subscriptions", "Bulk data operations", "Data export and import"] },
    ],
  },
  "/developers/tools/cli": {
    breadcrumb: "Tools",
    title: "CLI",
    subtitle: "Manage Yangu projects from your terminal.",
    sections: [
      { title: "CLI commands", items: ["yangu init — scaffold a new project", "yangu deploy — deploy edge functions", "yangu logs — stream function logs", "yangu keys — manage API keys"] },
    ],
  },
  "/developers/tools/sdks": {
    breadcrumb: "Tools",
    title: "SDKs & Libraries",
    subtitle: "Official client libraries for building on Yangu.",
    sections: [
      { title: "Available SDKs", items: ["JavaScript / TypeScript (npm)", "Python (pip)", "Go module", "REST client generation (OpenAPI)"] },
    ],
  },
  "/developers/tools/edge-functions": {
    breadcrumb: "Tools",
    title: "Edge Functions",
    subtitle: "Run serverless functions close to your users with zero cold starts.",
    sections: [
      { title: "Edge function development", items: ["Creating and deploying functions", "Environment variables and secrets", "Request/response handling", "Connecting to the database"] },
    ],
  },
  "/developers/extensibility/apps": {
    breadcrumb: "Extensibility",
    title: "Apps & Extensions",
    subtitle: "Build installable apps that extend the Yangu platform.",
    sections: [
      { title: "App architecture", items: ["App manifest and configuration", "Permission scopes", "UI extensions and hooks", "App lifecycle (install, configure, uninstall)"] },
      { title: "Distribution", items: ["App Store submission flow", "Review process", "Versioning and updates"] },
    ],
  },
  "/developers/extensibility/widgets": {
    breadcrumb: "Extensibility",
    title: "Widgets & Embeds",
    subtitle: "Create embeddable UI components that surface owners can install.",
    sections: [
      { title: "Widget framework", items: ["Widget manifest spec", "Sandboxed rendering", "Communication protocol (postMessage)", "Theming and style inheritance"] },
    ],
  },
  "/developers/extensibility/providers": {
    breadcrumb: "Extensibility",
    title: "Providers",
    subtitle: "Register AI models, payment processors, and third-party services.",
    sections: [
      { title: "Provider registry", items: ["Provider types (AI, payment, messaging, storage)", "Configuration schema", "Enable / disable per environment", "Provider SDK hooks"] },
    ],
  },
  "/developers/infrastructure/custom-domains": {
    breadcrumb: "Infrastructure",
    title: "Custom Domains",
    subtitle: "Map your own domains to surfaces and manage DNS programmatically.",
    sections: [
      { title: "Domain management", items: ["DNS verification flow", "SSL certificate provisioning", "Subdomain routing", "Domain API endpoints"] },
    ],
  },
  "/developers/infrastructure/environments": {
    breadcrumb: "Infrastructure",
    title: "Environments",
    subtitle: "Isolate development, staging, and production with separate data and keys.",
    sections: [
      { title: "Environment management", items: ["Dev / Staging / Production tiers", "Data isolation guarantees", "Environment-scoped API keys", "Promoting between environments"] },
    ],
  },
  "/developers/infrastructure/rate-limits-credits": {
    breadcrumb: "Infrastructure",
    title: "Rate Limits & Credits",
    subtitle: "Understand API rate limits and credit consumption.",
    sections: [
      { title: "Rate limiting", items: ["Per-key rate limits", "Burst allowances", "429 response handling", "Rate limit headers"] },
      { title: "Credits system", items: ["Credit consumption by endpoint", "Balance checking API", "Top-up and auto-recharge", "Usage analytics"] },
    ],
  },
  "/developers/infrastructure/logs-status": {
    breadcrumb: "Infrastructure",
    title: "Logs & Status",
    subtitle: "Monitor your integrations and check platform health.",
    sections: [
      { title: "Observability", items: ["Request logging", "Webhook delivery logs", "Edge function logs", "Platform status page"] },
    ],
  },
  "/developers/infrastructure/changelog": {
    breadcrumb: "Infrastructure",
    title: "Changelog",
    subtitle: "Track API changes, new features, and deprecations.",
    sections: [
      { title: "Recent changes", items: ["API versioning policy", "Breaking change notices", "Migration guides", "Feature announcements"] },
    ],
  },
};

export default function DocsPlaceholder() {
  const location = useLocation();
  const config = pageConfig[location.pathname];

  if (!config) {
    return (
      <DocsPage breadcrumb="Developers" title="Page not found" subtitle="This documentation page doesn't exist yet.">
        <p className="text-white/40 text-sm">Navigate using the sidebar to find available docs.</p>
      </DocsPage>
    );
  }

  return (
    <DocsPage breadcrumb={config.breadcrumb} title={config.title} subtitle={config.subtitle}>
      {config.sections.map((section) => (
        <PlaceholderBlock key={section.title} title={section.title} items={section.items} />
      ))}
    </DocsPage>
  );
}
