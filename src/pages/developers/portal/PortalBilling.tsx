import { DocsPage, DocsSection, PlaceholderBlock } from "@/components/developers/DocsPage";
import { CreditCard, Sparkles, CheckCircle2, Clock, AlertTriangle, Webhook, Zap, Users, ShieldCheck } from "lucide-react";

const STATUS_STYLES = {
  live: { bg: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.25)", color: "#22c55e", label: "Live" },
  partial: { bg: "rgba(250,204,21,0.10)", border: "rgba(250,204,21,0.25)", color: "#facc15", label: "Partial" },
  planned: { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.10)", label: "Planned" },
} as const;

function StatusBadge({ status }: { status: keyof typeof STATUS_STYLES }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
    >
      {status === "live" && <CheckCircle2 className="w-3 h-3" />}
      {status === "partial" && <Clock className="w-3 h-3" />}
      {status === "planned" && <AlertTriangle className="w-3 h-3" />}
      {s.label}
    </span>
  );
}

interface FeatureRowProps {
  title: string;
  description: string;
  status: keyof typeof STATUS_STYLES;
}

function FeatureRow({ title, description, status }: FeatureRowProps) {
  return (
    <div
      className="flex items-start justify-between gap-4 p-4 rounded-lg"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="min-w-0">
        <p className="text-foreground text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-xs mt-1">{description}</p>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}

export default function PortalBilling() {
  return (
    <DocsPage breadcrumb="Portal" title="Billing & Payments" subtitle="Platform billing capabilities, payment flows, and subscription management for YANGU.">

      {/* Developer API billing status */}
      <div
        className="rounded-xl p-6 mb-10"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg" style={{ background: "rgba(244,109,42,0.10)" }}>
            <Sparkles className="w-5 h-5" style={{ color: "#F46D2A" }} />
          </div>
          <div>
            <h3 className="text-foreground font-semibold text-sm">Developer API — Free during beta</h3>
            <p className="text-muted-foreground text-xs">API calls, apps, and webhooks are unlimited. No credit card required.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "API calls", value: "Unlimited" },
            { label: "Apps", value: "Unlimited" },
            { label: "Webhooks", value: "Unlimited" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg p-3 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-muted-foreground text-xs mb-0.5">{item.label}</p>
              <p className="text-foreground font-semibold text-sm">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Platform plans */}
      <DocsSection title="Platform Plans" description="User-facing subscription tiers managed via the billing system.">
        <div className="space-y-2">
          <FeatureRow title="Free tier" description="1 surface, 0 AI credits. Default for all new users." status="live" />
          <FeatureRow title="Creator plan — $15/mo" description="3 surfaces, 10 image generations, 5 video generations, 1 avatar." status="live" />
          <FeatureRow title="Pro plan — $100/mo" description="15 surfaces, 100 image generations, 30 video generations, 5 avatars." status="live" />
          <FeatureRow title="Enterprise tier" description="Uncapped limits. Admin-provisioned only." status="live" />
          <FeatureRow title="Entitlement enforcement" description="Usage limits enforced via user_entitlements table with admin bypass for whitelisted accounts." status="live" />
          <FeatureRow title="Plan switching (admin)" description="Plan upgrades/downgrades via admin_set_user_entitlements RPC. Resets usage counters." status="live" />
          <FeatureRow title="Self-service plan switching" description="User-facing plan management UI with live payment provider." status="planned" />
        </div>
      </DocsSection>

      {/* Payment flows */}
      <DocsSection title="Payment Flows" description="How payments are processed on the YANGU platform.">
        <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3 mt-2">Creator commerce (live)</h4>
        <div className="space-y-2 mb-6">
          <FeatureRow title="Manual payment methods" description="Bank transfer, Mobile Money, Cash on Delivery, PayPal link. Configured per creator in payment settings." status="live" />
          <FeatureRow title="Checkout flow" description="Buyer sees creator's enabled payment instructions → confirms via 'I have paid' → creator marks paid in orders dashboard." status="live" />
          <FeatureRow title="Payment attempts tracking" description="payment_attempts table tracks per-order payment state (initiated, pending, succeeded, failed)." status="live" />
          <FeatureRow title="Creator payment profiles" description="Stored in creator_payment_profiles with RLS protection. Public display via get_creator_payment_methods RPC (sanitized/masked)." status="live" />
          <FeatureRow title="Order tracking" description="Anonymous order lookup via track_order RPC using tracking code + email. Rate-limited to 10 per 60s." status="live" />
        </div>

        <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">Platform subscriptions (partial)</h4>
        <div className="space-y-2">
          <FeatureRow title="Stripe checkout session" description="Edge function stripe-create-checkout implemented. Creates checkout sessions server-side." status="partial" />
          <FeatureRow title="Stripe webhook handler" description="stripe-webhook edge function with idempotency via billing_events. Manages subscription lifecycle and quota resets." status="partial" />
          <FeatureRow title="PayPal integration" description="Schema prepared (billing_customers.paypal_payer_id). Edge function not yet active." status="planned" />
          <FeatureRow title="Live payment activation" description="Stripe/PayPal payment flows are paused. Plans are currently admin-provisioned only." status="planned" />
        </div>
      </DocsSection>

      {/* Webhook visibility */}
      <DocsSection title="Billing Webhooks" description="Webhook events related to billing and payment lifecycle.">
        <div className="space-y-2">
          <FeatureRow title="Stripe webhook ingestion" description="billing_events table stores raw Stripe webhook payloads with event_id for deduplication." status="partial" />
          <FeatureRow title="Subscription state sync" description="Webhook updates billing_subscriptions status and current_period_end. Downgrades enforced after period ends." status="partial" />
          <FeatureRow title="Quota reset on renewal" description="current_period_start comparison triggers usage counter reset in user_entitlements." status="partial" />
          <FeatureRow title="Developer webhook forwarding" description="Billing events are not yet forwarded to developer app webhooks." status="planned" />
        </div>
      </DocsSection>

      {/* API relationship */}
      <DocsSection title="Billing API" description="Database tables and RPCs related to billing.">
        <div
          className="rounded-lg p-4 mb-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h4 className="text-foreground text-sm font-medium mb-3">Core tables</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              "billing_customers",
              "billing_subscriptions",
              "billing_events",
              "user_entitlements",
              "credit_transactions",
              "creator_payment_profiles",
              "payment_attempts",
              "trials",
            ].map((t) => (
              <code
                key={t}
                className="text-xs px-2 py-1.5 rounded"
                style={{ background: "rgba(255,255,255,0.05)", }}
              >
                {t}
              </code>
            ))}
          </div>
        </div>
        <div
          className="rounded-lg p-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h4 className="text-foreground text-sm font-medium mb-3">Key RPCs & edge functions</h4>
          <div className="space-y-1.5">
            {[
              { name: "admin_set_user_entitlements", desc: "Admin-only plan provisioning with usage reset" },
              { name: "get_creator_payment_methods", desc: "Public-safe creator payout display (masked)" },
              { name: "track_order", desc: "Anonymous order lookup (rate-limited)" },
              { name: "has_used_trial", desc: "Check if user has consumed trial" },
              { name: "stripe-create-checkout", desc: "Edge fn — creates Stripe checkout session" },
              { name: "stripe-webhook", desc: "Edge fn — processes Stripe lifecycle events" },
            ].map((r) => (
              <div key={r.name} className="flex items-start gap-2">
                <code
                  className="text-xs px-2 py-1 rounded shrink-0"
                  style={{ background: "rgba(244,109,42,0.10)", color: "#F46D2A" }}
                >
                  {r.name}
                </code>
                <span className="text-muted-foreground text-xs">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </DocsSection>

      {/* Security notes */}
      <DocsSection title="Security" description="Billing-related security measures.">
        <div className="space-y-2">
          <FeatureRow title="Server-side billing writes" description="All subscription mutations use service role keys via edge functions. No client-side billing writes." status="live" />
          <FeatureRow title="Payment profile RLS" description="creator_payment_profiles protected by strict RLS. Public access only through sanitized RPC." status="live" />
          <FeatureRow title="Webhook idempotency" description="billing_events deduplicates by event_id to prevent double-processing." status="partial" />
          <FeatureRow title="Rate-limited order tracking" description="track_order enforces 10 req/60s per IP via check_rate_limit_anon." status="live" />
        </div>
      </DocsSection>

      {/* Planned */}
      <PlaceholderBlock
        title="Planned billing capabilities"
        items={[
          "Self-service plan management UI for end users",
          "PayPal subscription integration (schema ready)",
          "Developer billing event webhook forwarding",
          "Usage-based metering for AI generations",
          "Invoice generation and history",
        ]}
      />
    </DocsPage>
  );
}
