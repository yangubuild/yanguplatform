import { useLocation } from "react-router-dom";
import { DocsPage, DocsSection } from "@/components/developers/DocsPage";

/* ─── helpers ─── */
interface CodeBlockProps { code: string }
function CodeBlock({ code }: CodeBlockProps) {
  return (
    <pre
      className="rounded-lg p-4 text-xs leading-relaxed overflow-x-auto mb-4"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <code>{code}</code>
    </pre>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-sm mb-4 text-muted-foreground">{children}</p>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider mr-2 mb-2" style={{ background: "rgba(244,109,42,0.15)", color: "#F46D2A" }}>
      {children}
    </span>
  );
}

function TableRow({ cells }: { cells: string[] }) {
  return (
    <tr className="border-b border-white/5">
      {cells.map((c, i) => (
        <td key={i} className="px-3 py-2 text-xs" style={{ color: i === 0 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.5)" }}>{c}</td>
      ))}
    </tr>
  );
}

/* ─── page content by route ─── */
const pages: Record<string, () => JSX.Element> = {
  "/developers/apis/rest-graphql": () => (
    <DocsPage breadcrumb="APIs" title="REST & GraphQL" subtitle="Access the yangu platform through a unified API layer.">
      <DocsSection id="rest" title="REST API" description="The primary interface for platform operations.">
        <Paragraph>Base URL: <code className="text-muted-foreground">https://api.yangu.com/v1</code></Paragraph>
        <Paragraph>All endpoints are versioned. The current stable version is <strong className="text-muted-foreground">v1</strong>. Include your API key in the <code className="text-muted-foreground">Authorization</code> header as a Bearer token.</Paragraph>
        <CodeBlock code={`GET /v1/surfaces?page=1&limit=20
Authorization: Bearer yng_live_xxxx

# Pagination
# All list endpoints support ?page= and ?limit= (max 100).
# Responses include { data: [...], meta: { page, limit, total } }`} />
        <Paragraph>Errors follow a consistent JSON shape:</Paragraph>
        <CodeBlock code={`{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'name' is required.",
    "status": 422
  }
}`} />
      </DocsSection>

      <DocsSection id="graphql" title="GraphQL" description="Query exactly the data you need.">
        <Badge>Preview</Badge>
        <Paragraph>Endpoint: <code className="text-muted-foreground">https://api.yangu.com/graphql</code></Paragraph>
        <Paragraph>Authenticate with the same Bearer token. The schema explorer is available at <code className="text-muted-foreground">/graphql/explorer</code> (introspection enabled in dev environments).</Paragraph>
        <CodeBlock code={`query {
  surface(slug: "my-site") {
    id
    title
    domain { host }
    agents { name status }
  }
}`} />
        <Paragraph>Mutations follow the same auth model. Subscriptions for real-time data are on the roadmap.</Paragraph>
      </DocsSection>
    </DocsPage>
  ),

  "/developers/apis/authentication": () => (
    <DocsPage breadcrumb="APIs" title="Authentication" subtitle="Secure your integrations with OAuth 2.0, API keys, and session tokens.">
      <DocsSection id="oauth" title="OAuth 2.0" description="Redirect-based authentication for user-facing apps.">
        <Paragraph>yangu supports the Authorization Code flow with PKCE for single-page apps and the Client Credentials grant for server-to-server integrations.</Paragraph>
        <CodeBlock code={`# 1. Redirect user to authorize
GET https://auth.yangu.com/authorize
  ?client_id=YOUR_APP_ID
  &redirect_uri=https://yourapp.com/callback
  &response_type=code
  &code_challenge=XXXX
  &code_challenge_method=S256

# 2. Exchange code for tokens
POST https://auth.yangu.com/token
  { grant_type: "authorization_code", code, redirect_uri, code_verifier }`} />
      </DocsSection>

      <DocsSection id="api-keys" title="API Keys" description="Simple authentication for backend integrations.">
        <Paragraph>Generate keys in the Developer Console. Keys are scoped to an environment (dev / prod) and prefixed with <code className="text-muted-foreground">yng_dev_</code> or <code className="text-muted-foreground">yng_live_</code>.</Paragraph>
        <Paragraph>Pass as a Bearer token in the <code className="text-muted-foreground">Authorization</code> header. Rotate keys without downtime — old keys remain valid for 24 hours after rotation.</Paragraph>
      </DocsSection>

      <DocsSection id="sessions" title="Sessions" description="Browser-based session management.">
        <Paragraph>User sessions are managed via secure HTTP-only cookies. Session tokens refresh automatically. Use the <code className="text-muted-foreground">/auth/session</code> endpoint to inspect the current session.</Paragraph>
      </DocsSection>
    </DocsPage>
  ),

  "/developers/apis/webhooks": () => (
    <DocsPage breadcrumb="APIs" title="Webhooks" subtitle="Receive real-time notifications when events happen on the platform.">
      <DocsSection id="register" title="Registering Endpoints" description="Configure webhooks in the Developer Console or via the API.">
        <CodeBlock code={`POST /v1/webhooks
{
  "url": "https://yourapp.com/webhooks/yangu",
  "events": ["surface.published", "app.installed", "payment.completed"],
  "is_active": true
}`} />
      </DocsSection>

      <DocsSection id="events" title="Events Catalog">
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-left">
            <thead><tr className="border-b border-white/10">
              <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Event</th>
              <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Description</th>
            </tr></thead>
            <tbody>
              <TableRow cells={["surface.published", "A surface was published or updated"]} />
              <TableRow cells={["app.installed", "An app was installed by an org"]} />
              <TableRow cells={["app.uninstalled", "An app was removed"]} />
              <TableRow cells={["payment.completed", "A payment was successfully processed"]} />
              <TableRow cells={["webhook.test", "Manual test ping from console"]} />
            </tbody>
          </table>
        </div>
      </DocsSection>

      <DocsSection id="verification" title="Signature Verification" description="Verify webhook authenticity using HMAC-SHA256.">
        <CodeBlock code={`import crypto from "crypto";

function verifySignature(payload: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`} />
      </DocsSection>

      <DocsSection id="retries" title="Retries & Delivery Logs">
        <Paragraph>Failed deliveries are retried up to 5 times with exponential backoff (1m, 5m, 30m, 2h, 12h). View delivery history and replay failed events from the Developer Console.</Paragraph>
      </DocsSection>
    </DocsPage>
  ),

  "/developers/apis/data": () => (
    <DocsPage breadcrumb="APIs" title="Data Access" subtitle="Direct database access with row-level security and real-time subscriptions.">
      <DocsSection id="rls" title="Row-Level Security" description="Every query is filtered by RLS policies — no data leaks by default.">
        <Paragraph>When your app accesses data through the API, RLS policies automatically scope results to the authenticated user's permissions. You never need to add manual WHERE clauses for authorization.</Paragraph>
        <CodeBlock code={`-- Example: users can only read their own org's surfaces
CREATE POLICY "org_surfaces_select" ON surfaces
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid()
    )
  );`} />
      </DocsSection>

      <DocsSection id="patterns" title="Safe Query Patterns">
        <Paragraph>Use the yangu client SDK for type-safe queries. Avoid raw SQL in client-side code.</Paragraph>
        <CodeBlock code={`import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase
  .from("surfaces")
  .select("id, title, domain:domains(host)")
  .eq("is_published", true)
  .order("created_at", { ascending: false })
  .limit(20);`} />
      </DocsSection>

      <DocsSection id="realtime" title="Real-time Subscriptions">
        <Badge>Beta</Badge>
        <Paragraph>Subscribe to row-level changes using the real-time channel API. Requires the table to be added to the realtime publication.</Paragraph>
      </DocsSection>
    </DocsPage>
  ),

  "/developers/tools/cli": () => (
    <DocsPage breadcrumb="Tools" title="CLI" subtitle="Manage yangu projects from your terminal.">
      <DocsSection id="install" title="Installation">
        <CodeBlock code={`npm install -g @yangu/cli
# or
brew install yangu/tap/yangu`} />
      </DocsSection>
      <DocsSection id="commands" title="Commands">
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-left">
            <thead><tr className="border-b border-white/10">
              <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Command</th>
              <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Description</th>
            </tr></thead>
            <tbody>
              <TableRow cells={["yangu init", "Scaffold a new project with config files"]} />
              <TableRow cells={["yangu deploy", "Deploy edge functions to production"]} />
              <TableRow cells={["yangu logs", "Stream function logs in real time"]} />
              <TableRow cells={["yangu keys list", "List all API keys for the current project"]} />
              <TableRow cells={["yangu keys rotate", "Rotate an API key with zero downtime"]} />
            </tbody>
          </table>
        </div>
        <Badge>Preview</Badge>
        <Paragraph>The CLI is in active development. Run <code className="text-muted-foreground">yangu --help</code> for the full command reference.</Paragraph>
      </DocsSection>
    </DocsPage>
  ),

  "/developers/tools/sdks": () => (
    <DocsPage breadcrumb="Tools" title="SDKs & Libraries" subtitle="Official client libraries for building on yangu.">
      <DocsSection id="js" title="JavaScript / TypeScript" description="The primary SDK for web and Node.js integrations.">
        <CodeBlock code={`npm install @yangu/sdk`} />
        <CodeBlock code={`import { YanguClient } from "@yangu/sdk";

const client = new YanguClient({
  apiKey: process.env.YANGU_API_KEY,
});

const surfaces = await client.surfaces.list({ limit: 10 });`} />
      </DocsSection>
      <DocsSection id="others" title="Other Languages">
        <Badge>Preview</Badge>
        <Paragraph>Python and Go SDKs are in development. In the meantime, use the REST API directly — all endpoints are fully documented with OpenAPI specs available for client generation.</Paragraph>
      </DocsSection>
    </DocsPage>
  ),

  "/developers/tools/edge-functions": () => (
    <DocsPage breadcrumb="Tools" title="Edge Functions" subtitle="Run serverless functions close to your users with zero cold starts.">
      <DocsSection id="create" title="Creating Functions" description="Edge functions live in your project's supabase/functions/ directory.">
        <CodeBlock code={`// supabase/functions/hello/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { name } = await req.json();
  return new Response(
    JSON.stringify({ message: \`Hello, \${name}!\` }),
    { headers: { "Content-Type": "application/json" } }
  );
});`} />
      </DocsSection>
      <DocsSection id="secrets" title="Environment Variables & Secrets">
        <Paragraph>Secrets are managed through the platform. Access them via <code className="text-muted-foreground">Deno.env.get("SECRET_NAME")</code>. Never commit secrets to your repository.</Paragraph>
      </DocsSection>
      <DocsSection id="deploy" title="Deployment">
        <Paragraph>Functions are deployed automatically when you push code changes. Use <code className="text-muted-foreground">yangu deploy</code> for manual deployments.</Paragraph>
      </DocsSection>
    </DocsPage>
  ),

  "/developers/extensibility/apps": () => (
    <DocsPage breadcrumb="Extensibility" title="Apps & Extensions" subtitle="Build installable apps that extend the yangu platform.">
      <DocsSection id="architecture" title="App Architecture" description="Apps are registered in the Developer Console and distributed through the App Store.">
        <Paragraph>Each app defines a manifest with permissions (scopes), webhook subscriptions, and optional UI widgets. Apps are installed per-org and can be configured per-surface.</Paragraph>
        <CodeBlock code={`// App manifest (simplified)
{
  "name": "Analytics Pro",
  "slug": "analytics-pro",
  "scopes": ["surfaces:read", "analytics:read"],
  "widgets": [
    { "key": "dashboard", "title": "Analytics Dashboard", "iframe_url": "..." }
  ],
  "webhooks": ["surface.published", "payment.completed"]
}`} />
      </DocsSection>
      <DocsSection id="lifecycle" title="App Lifecycle">
        <Paragraph>Install → Configure → Active → Uninstall. On install, yangu provisions API keys scoped to the granted permissions and delivers an <code className="text-muted-foreground">app.installed</code> webhook.</Paragraph>
      </DocsSection>
      <DocsSection id="review" title="App Store Review">
        <Paragraph>Apps submitted for public distribution go through an automated + manual review process. Reviews check scope justification, security practices, and UI quality.</Paragraph>
      </DocsSection>
    </DocsPage>
  ),

  "/developers/extensibility/widgets": () => (
    <DocsPage breadcrumb="Extensibility" title="Widgets & Embeds" subtitle="Create embeddable UI components that surface owners can install.">
      <DocsSection id="framework" title="Widget Framework" description="Widgets render in sandboxed iframes with a secure communication protocol.">
        <Paragraph>Register widgets in the developer_widget_registry. Each widget declares its key, iframe URL, allowed events, and default dimensions.</Paragraph>
        <CodeBlock code={`// Widget ↔ Host communication
window.parent.postMessage({
  type: "yangu:widget:ready",
  widgetKey: "my-widget"
}, "*");

// Receive context from host
window.addEventListener("message", (event) => {
  if (event.data.type === "yangu:widget:context") {
    const { surfaceId, orgId, theme } = event.data;
    // Initialize widget with context
  }
});`} />
      </DocsSection>
      <DocsSection id="theming" title="Theming">
        <Paragraph>Widgets inherit the host surface's theme tokens via the context message. Use CSS custom properties for seamless visual integration.</Paragraph>
      </DocsSection>
    </DocsPage>
  ),

  "/developers/extensibility/providers": () => (
    <DocsPage breadcrumb="Extensibility" title="Providers" subtitle="Register AI models, payment processors, and third-party services.">
      <DocsSection id="registry" title="Provider Registry" description="Providers are registered with a type, configuration schema, and capability declaration.">
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-left">
            <thead><tr className="border-b border-white/10">
              <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Type</th>
              <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Examples</th>
            </tr></thead>
            <tbody>
              <TableRow cells={["AI", "Gemini, OpenAI, Qwen, Ideogram"]} />
              <TableRow cells={["Payment", "Stripe, M-Pesa"]} />
              <TableRow cells={["Messaging", "SMS, Email, Push"]} />
              <TableRow cells={["Storage", "S3-compatible, CDN"]} />
            </tbody>
          </table>
        </div>
        <Paragraph>Providers can be enabled/disabled per environment and require developer_provider_permissions for access.</Paragraph>
      </DocsSection>
      <DocsSection id="hooks" title="Provider SDK Hooks">
        <Badge>Beta</Badge>
        <Paragraph>Use provider hooks in your app code to call registered providers through the runtime router without managing credentials directly.</Paragraph>
      </DocsSection>
    </DocsPage>
  ),

  "/developers/infrastructure/custom-domains": () => (
    <DocsPage breadcrumb="Infrastructure" title="Custom Domains" subtitle="Map your own domains to surfaces and manage DNS programmatically.">
      <DocsSection id="setup" title="Domain Setup" description="Add a custom domain through the API or surface editor.">
        <Paragraph>Point a CNAME record to <code className="text-muted-foreground">proxy.yangu.com</code>. yangu automatically provisions and renews SSL certificates via Let's Encrypt.</Paragraph>
        <CodeBlock code={`POST /v1/domains
{
  "host": "docs.yourcompany.com",
  "surface_id": "...",
  "domain_type": "custom"
}`} />
      </DocsSection>
      <DocsSection id="routing" title="Subdomain Routing">
        <Paragraph>Wildcard subdomains are supported for multi-tenant setups. Each subdomain can map to a different surface or surface publish.</Paragraph>
      </DocsSection>
    </DocsPage>
  ),

  "/developers/infrastructure/environments": () => (
    <DocsPage breadcrumb="Infrastructure" title="Environments" subtitle="Isolate development, staging, and production with separate data and keys.">
      <DocsSection id="tiers" title="Environment Tiers">
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-left">
            <thead><tr className="border-b border-white/10">
              <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Environment</th>
              <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Key prefix</th>
              <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Data isolation</th>
            </tr></thead>
            <tbody>
              <TableRow cells={["Development", "yng_dev_", "Separate database"]} />
              <TableRow cells={["Staging", "yng_stg_", "Snapshot of production schema"]} />
              <TableRow cells={["Production", "yng_live_", "Live data"]} />
            </tbody>
          </table>
        </div>
        <Paragraph>API keys are scoped to their environment. A dev key cannot access production data. Promote changes between environments using the CLI or Console.</Paragraph>
      </DocsSection>
    </DocsPage>
  ),

  "/developers/infrastructure/rate-limits-credits": () => (
    <DocsPage breadcrumb="Infrastructure" title="Rate Limits & Credits" subtitle="Understand API rate limits and credit consumption.">
      <DocsSection id="limits" title="Rate Limiting" description="Requests are rate-limited per API key.">
        <Paragraph>Default limits: 100 requests/minute for dev keys, 1000 requests/minute for production keys. Burst allowance of 2× for short spikes.</Paragraph>
        <Paragraph>Rate limit headers are included in every response:</Paragraph>
        <CodeBlock code={`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1706745600`} />
        <Paragraph>When rate-limited, the API returns <code className="text-muted-foreground">429 Too Many Requests</code> with a <code className="text-muted-foreground">Retry-After</code> header.</Paragraph>
      </DocsSection>
      <DocsSection id="credits" title="Credits System" description="AI and compute operations consume credits.">
        <Paragraph>Check your balance via the API or Console. Credits auto-recharge when below a configurable threshold on paid plans.</Paragraph>
        <CodeBlock code={`GET /v1/credits/balance
→ { "balance": 4250, "auto_recharge": true, "threshold": 500 }`} />
      </DocsSection>
    </DocsPage>
  ),

  "/developers/infrastructure/logs-status": () => (
    <DocsPage breadcrumb="Infrastructure" title="Logs & Status" subtitle="Monitor your integrations and check platform health.">
      <DocsSection id="logs" title="Request Logging" description="All API requests are logged and accessible via the Console.">
        <Paragraph>Logs include request method, path, status code, latency, and response size. Filter by time range, status, or endpoint. Webhook delivery logs and edge function logs are available in their respective Console tabs.</Paragraph>
      </DocsSection>
      <DocsSection id="status" title="Platform Status">
        <Paragraph>Check real-time platform status at <code className="text-muted-foreground">status.yangu.com</code>. Subscribe to incident notifications via email or webhook.</Paragraph>
      </DocsSection>
    </DocsPage>
  ),

  "/developers/infrastructure/changelog": () => (
    <DocsPage breadcrumb="Infrastructure" title="Changelog" subtitle="Track API changes, new features, and deprecations.">
      <DocsSection id="policy" title="Versioning Policy">
        <Paragraph>The API follows semantic versioning. Breaking changes are introduced in new major versions only. Deprecated endpoints remain available for at least 6 months with deprecation headers.</Paragraph>
      </DocsSection>
      <DocsSection id="recent" title="Recent Changes">
        <div className="space-y-4">
          <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Badge>2026-02</Badge>
              <span className="text-muted-foreground text-sm font-medium">Provider Router & Widget Registry</span>
            </div>
            <Paragraph>Runtime-pluggable provider execution and registry-driven widget resolution for ADA and Studio.</Paragraph>
          </div>
          <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Badge>2026-01</Badge>
              <span className="text-muted-foreground text-sm font-medium">Surface Context API</span>
            </div>
            <Paragraph>Canonical surface context for consistent runtime execution across all platform surfaces.</Paragraph>
          </div>
        </div>
      </DocsSection>
    </DocsPage>
  ),
};

export default function DocsPlaceholder() {
  const location = useLocation();
  const Page = pages[location.pathname];

  if (!Page) {
    return (
      <DocsPage breadcrumb="Developers" title="Page not found" subtitle="This documentation page doesn't exist yet.">
        <p className="text-muted-foreground text-sm">Navigate using the sidebar to find available docs.</p>
      </DocsPage>
    );
  }

  return <Page />;
}
