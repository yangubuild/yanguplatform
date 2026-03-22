import type { InvoiceFormData } from "../InvoiceComposer";

interface Props { form: InvoiceFormData; }

const today = () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
const dueDate = () => {
  const d = new Date(); d.setDate(d.getDate() + 7);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

export function InvoicePdfPreview({ form }: Props) {
  const amt = parseFloat(form.amount) || 0;
  const formatted = `$${amt.toFixed(2)}`;
  const companyName = form.customer || "Fresh & Wholesome Foods Co.";

  return (
    <div className="flex justify-center pt-4">
      <div
        className="w-full max-w-lg rounded-lg overflow-hidden"
        style={{ background: "white", color: "#111", minHeight: 500 }}>
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <h2 className="text-xl font-bold" style={{ color: "#111" }}>Invoice</h2>
            <p className="text-sm font-semibold text-right" style={{ color: "#111" }}>{companyName}</p>
          </div>

          {/* Meta */}
          <div className="flex flex-col gap-1 mb-6 text-sm" style={{ color: "#555" }}>
            <div className="flex justify-between">
              <span>Invoice number</span>
              <span style={{ color: "#111" }}>00000001</span>
            </div>
            <div className="flex justify-between">
              <span>Date of issue</span>
              <span style={{ color: "#111" }}>{today()}</span>
            </div>
            <div className="flex justify-between">
              <span>Date due</span>
              <span style={{ color: "#111" }}>{dueDate()}</span>
            </div>
          </div>

          {/* Bill from/to */}
          <div className="flex gap-12 mb-8 text-sm">
            <div>
              <p className="font-semibold mb-1" style={{ color: "#111" }}>{companyName}</p>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: "#888" }}>Bill to</p>
            </div>
          </div>

          {/* Line items */}
          <div className="mb-6">
            <div className="flex justify-between text-xs font-medium pb-2 mb-2" style={{ borderBottom: "1px solid #e5e5e5", color: "#888" }}>
              <span>Product</span>
              <span>Amount</span>
            </div>
            <div className="flex justify-between text-sm py-2">
              <span style={{ color: "#111" }}>{form.product}</span>
              <span style={{ color: "#111" }}>{formatted}</span>
            </div>
          </div>

          {/* Totals */}
          <div className="flex flex-col items-end gap-1 text-sm mb-10">
            <div className="flex gap-8">
              <span style={{ color: "#888" }}>Subtotal</span>
              <span style={{ color: "#111" }}>{formatted}</span>
            </div>
            <div className="flex gap-8 font-semibold">
              <span style={{ color: "#888" }}>Amount due</span>
              <span style={{ color: "#111" }}>{formatted}</span>
            </div>
          </div>

          {/* Footer */}
          <p className="text-[10px]" style={{ color: "#aaa" }}>
            Invoice has been issued by the seller in the name and on behalf of {companyName}.
          </p>
        </div>
      </div>
    </div>
  );
}
