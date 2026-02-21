import { DocsPage } from "@/components/developers/DocsPage";
import { CreditCard, Sparkles } from "lucide-react";

export default function PortalBilling() {
  return (
    <DocsPage breadcrumb="Portal" title="Billing" subtitle="Manage your developer platform billing and usage.">
      <div
        className="rounded-xl p-8 text-center"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{ background: "rgba(244,109,42,0.10)", border: "1px solid rgba(244,109,42,0.20)" }}
        >
          <Sparkles className="w-4 h-4" style={{ color: "#F46D2A" }} />
          <span className="text-sm font-semibold" style={{ color: "#F46D2A" }}>Free during beta</span>
        </div>

        <h3 className="text-white font-semibold text-lg mb-3">No payment required</h3>
        <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
          All developer platform features are free during the beta period. No credit card needed. We'll notify you before any pricing changes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {[
            { label: "API calls", value: "Unlimited" },
            { label: "Apps", value: "Unlimited" },
            { label: "Webhooks", value: "Unlimited" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-white/40 text-xs mb-1">{item.label}</p>
              <p className="text-white font-semibold text-lg">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </DocsPage>
  );
}
