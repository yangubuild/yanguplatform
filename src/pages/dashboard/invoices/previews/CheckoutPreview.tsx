import type { InvoiceFormData } from "../InvoiceComposer";

interface Props { form: InvoiceFormData; }

export function CheckoutPreview({ form }: Props) {
  const amt = parseFloat(form.amount) || 0;
  const formatted = `$${amt.toFixed(2)}`;
  const companyName = form.customer || "Fresh & Wholesome Foods Co.";

  return (
    <div className="flex justify-center pt-4">
      {/* Phone frame */}
      <div
        className="relative w-[320px] rounded-[36px] overflow-hidden"
        style={{
          background: "#1a1a1a",
          border: "8px solid #2a2a2a",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Notch */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-24 h-5 rounded-full" style={{ background: "#222" }} />
        </div>

        {/* Checkout content */}
        <div className="px-5 pb-6 pt-3">
          {/* Company */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-foreground" style={{ background: "#2563eb" }}>
              {companyName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <span className="text-xs text-foreground font-medium">{companyName}</span>
          </div>

          <p className="text-[11px] mb-3" className="text-muted-foreground">
            {form.description || "Transform Your Weekly Meals While Cutting Grocery Bills in Half"}
          </p>

          {/* Product + price */}
          <div className="text-center py-3 mb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs text-muted-foreground mb-0.5">{form.product}</p>
            <p className="text-2xl font-bold text-foreground">{formatted}</p>
          </div>

          {/* Email */}
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Email</label>
          <div className="rounded-lg px-3 py-2 mb-4 text-xs" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", }}>
            johnappleseed@gmail.com
          </div>

          {/* Payment methods */}
          <p className="text-[11px] font-medium text-muted-foreground mb-2">Payment methods</p>
          <div className="flex flex-col gap-2 mb-4">
            {["Card", "Balance", "Apple Pay"].map((m, i) => (
              <div
                key={m}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: i === 0 ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.06)", }}
              >
                <div className="w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: i === 0 ? "white" : "rgba(255,255,255,0.2)" }}>
                  {i === 0 && <div className="w-1.5 h-1.5 rounded-full bg-white m-[2px]" />}
                </div>
                <span>{m}</span>
              </div>
            ))}
          </div>

          {/* Billing address */}
          <p className="text-[11px] font-medium text-muted-foreground mb-2">Billing address</p>
          <div className="flex flex-col gap-2">
            <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", }}>Name</div>
            <div className="rounded-lg px-3 py-2 text-xs flex justify-between items-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", }}>
              <span>United States</span>
              <span className="text-muted-foreground">▾</span>
            </div>
            <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", }}>Address line 1</div>
          </div>
        </div>
      </div>
    </div>
  );
}
