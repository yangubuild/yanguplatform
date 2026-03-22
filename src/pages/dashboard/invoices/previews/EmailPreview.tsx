import type { InvoiceFormData } from "../InvoiceComposer";

interface Props { form: InvoiceFormData; }

const today = () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
const dueDate = () => {
  const d = new Date(); d.setDate(d.getDate() + 7);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

export function EmailPreview({ form }: Props) {
  const amt = parseFloat(form.amount) || 0;
  const formatted = `$${amt.toFixed(2)}`;
  const companyName = form.customer || "Fresh & Wholesome Foods Co.";

  return (
    <div className="flex flex-col items-center gap-6 pt-4">
      {/* Company badge */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-foreground"
          style={{ background: "#2563eb" }}
        >
          {companyName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <span className="text-sm text-foreground font-medium">{companyName}</span>
      </div>

      {/* Invoice card */}
      <div className="w-full max-w-md rounded-xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="px-6 pt-6 pb-4">
          <p className="text-3xl font-bold text-foreground">{formatted}</p>
          <p className="text-sm mt-1 text-muted-foreground">Due {dueDate()}</p>
        </div>

        <div className="px-6 pb-3">
          <button className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            ↓ Download invoice
          </button>
        </div>

        <div className="px-6 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-muted-foreground">Invoice number</p>
          <p className="text-sm text-foreground font-medium">#00000001</p>
        </div>

        <div className="px-6 py-3">
          <button className="w-full py-3 rounded-lg text-sm font-medium" style={{ background: "rgba(255,255,255,0.08)" }}>
            Pay now
          </button>
        </div>
      </div>

      {/* Line items */}
      <div className="w-full max-w-md rounded-xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="px-6 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-muted-foreground">{today()}</p>
        </div>
        <div className="px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-foreground">{form.product}</span>
          <span className="text-sm text-foreground">{formatted}</span>
        </div>
        <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-sm font-medium text-foreground">Total</span>
          <span className="text-sm font-medium text-foreground">{formatted}</span>
        </div>
      </div>

      {/* Support */}
      <p className="text-xs max-w-md text-center text-muted-foreground">
        If you need any help, please reach out to support <span className="underline cursor-pointer" style={{ color: "#60a5fa" }}>here</span>.
      </p>
    </div>
  );
}
