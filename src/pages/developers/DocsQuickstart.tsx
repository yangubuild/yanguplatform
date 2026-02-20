import { DocsPage, DocsSection, PlaceholderBlock } from "@/components/developers/DocsPage";

export default function DocsQuickstart() {
  return (
    <DocsPage breadcrumb="Overview" title="Quickstart" subtitle="Get up and running with Yangu in under 5 minutes.">
      <DocsSection title="1. Create a Developer App">
        <p className="text-sm text-white/50 mb-4">
          Go to your Developer Console and create a new app. You'll get an app ID and can generate API keys immediately.
        </p>
      </DocsSection>

      <DocsSection title="2. Generate API Keys">
        <p className="text-sm text-white/50 mb-4">
          Create a development key pair from the Keys tab in your app settings. Keys follow the format <code className="text-white/70 bg-white/5 px-1.5 py-0.5 rounded text-xs">yng_dev_*</code>.
        </p>
      </DocsSection>

      <DocsSection title="3. Make Your First Request">
        <div className="rounded-lg p-4 mb-4 font-mono text-xs" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="text-white/40">$</span>{" "}
          <span className="text-white/70">curl -X GET https://api.yangu.io/v1/me \</span><br />
          <span className="text-white/70">&nbsp;&nbsp;-H "Authorization: Bearer yng_dev_YOUR_KEY"</span>
        </div>
      </DocsSection>

      <PlaceholderBlock title="Next steps" items={[
        "Set up webhooks to receive real-time events",
        "Configure OAuth for user-facing integrations",
        "Deploy your first edge function",
        "Submit your app to the App Store",
      ]} />
    </DocsPage>
  );
}
