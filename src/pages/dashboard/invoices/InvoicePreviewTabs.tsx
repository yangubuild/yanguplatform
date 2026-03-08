import { useState } from "react";
import type { InvoiceFormData } from "./InvoiceComposer";
import { EmailPreview } from "./previews/EmailPreview";
import { CheckoutPreview } from "./previews/CheckoutPreview";
import { InvoicePdfPreview } from "./previews/InvoicePdfPreview";

const TABS = ["Email preview", "Checkout link preview", "Invoice PDF"] as const;
type Tab = (typeof TABS)[number];

interface Props {
  form: InvoiceFormData;
}

export function InvoicePreviewTabs({ form }: Props) {
  const [tab, setTab] = useState<Tab>("Email preview");

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex justify-center pt-4 pb-3">
        <div
          className="flex rounded-lg overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: tab === t ? "rgba(255,255,255,0.12)" : "transparent",
                color: tab === t ? "white" : "rgba(255,255,255,0.45)",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {tab === "Email preview" && <EmailPreview form={form} />}
        {tab === "Checkout link preview" && <CheckoutPreview form={form} />}
        {tab === "Invoice PDF" && <InvoicePdfPreview form={form} />}
      </div>
    </div>
  );
}
