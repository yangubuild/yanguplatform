import { useState, useMemo } from "react";
import { X, ChevronRight, ChevronDown, Settings, CreditCard } from "lucide-react";
import { InvoicePreviewTabs } from "./InvoicePreviewTabs";

interface InvoiceComposerProps {
  onClose: () => void;
}

type BillingType = "one-time" | "recurring";

export interface InvoiceFormData {
  customer: string;
  product: string;
  dueOption: string;
  dueDate: string;
  description: string;
  billingType: BillingType;
  amount: string;
  currency: string;
  recurringCadence: string;
  advancedOptions: boolean;
  customPaymentMethods: boolean;
}

const defaultDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
};

const formatDate = (d: Date) =>
  `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

const formatDateLong = (d: Date) =>
  d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export function InvoiceComposer({ onClose }: InvoiceComposerProps) {
  const [form, setForm] = useState<InvoiceFormData>({
    customer: "",
    product: "Budget-Friendly Meal Prep Kits",
    dueOption: "Due in 7 days",
    dueDate: formatDate(defaultDueDate()),
    description: "",
    billingType: "one-time",
    amount: "100",
    currency: "USD",
    recurringCadence: "1 month",
    advancedOptions: false,
    customPaymentMethods: false,
  });

  const update = (key: keyof InvoiceFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const oneTimeChips = ["50", "100", "250"];
  const recurringChips = ["19.99", "39.99", "79.99"];
  const chips = form.billingType === "one-time" ? oneTimeChips : recurringChips;

  const canSend = form.customer.trim().length > 0 && parseFloat(form.amount) > 0;

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "white",
  };

  const labelStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.85)",
    fontWeight: 600,
    fontSize: "14px",
  };

  const mutedStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.4)",
  };

  return (
    <div
      className="flex w-full min-h-[calc(100vh-64px)]"
      style={{ background: "#0c0c0c" }}
    >
      {/* Left panel — form */}
      <div
        className="flex flex-col shrink-0 overflow-y-auto"
        style={{
          width: "min(540px, 42%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Top header */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.12)" }} />
          <span className="text-sm text-white/70">Invoices</span>
          <ChevronRight className="w-3.5 h-3.5 text-white/30" />
        </div>

        {/* Form body */}
        <div className="flex flex-col gap-0 flex-1 px-5 py-5">
          {/* Customer */}
          <Section label="Customer">
            <input
              type="text"
              placeholder="Find or add a customer"
              value={form.customer}
              onChange={(e) => update("customer", e.target.value)}
              className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none placeholder:text-white/30"
              style={inputStyle}
            />
          </Section>

          <Divider />

          {/* Product */}
          <Section label="Product">
            <div
              className="w-full rounded-lg px-3.5 py-2.5 text-sm flex items-center justify-between cursor-pointer"
              style={inputStyle}
            >
              <span className="text-white">{form.product}</span>
              <ChevronDown className="w-4 h-4 text-white/40" />
            </div>
          </Section>

          <Divider />

          {/* Payment collection */}
          <Section label="Payment collection">
            <p className="text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
              Due date
            </p>
            <div
              className="w-full rounded-lg px-3.5 py-2.5 text-sm flex items-center justify-between"
              style={inputStyle}
            >
              <span className="text-white">{form.dueOption}</span>
              <span className="flex items-center gap-1 text-white/70">
                {form.dueDate}
                <ChevronDown className="w-4 h-4 text-white/40" />
              </span>
            </div>
          </Section>

          <Divider />

          {/* Description */}
          <Section label="Description">
            <div className="relative">
              <textarea
                placeholder="Invoice for September coaching call"
                value={form.description}
                onChange={(e) => update("description", e.target.value.slice(0, 500))}
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none placeholder:text-white/30 min-h-[100px] resize-none"
                style={inputStyle}
              />
              <span
                className="absolute bottom-2 right-3 text-xs"
                style={mutedStyle}
              >
                {form.description.length} / 500
              </span>
            </div>
          </Section>

          <Divider />

          {/* Billing type toggle */}
          <div className="flex rounded-lg overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.06)" }}>
            {(["one-time", "recurring"] as BillingType[]).map((t) => (
              <button
                key={t}
                onClick={() => update("billingType", t)}
                className="flex-1 py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: form.billingType === t ? "rgba(255,255,255,0.12)" : "transparent",
                  color: form.billingType === t ? "white" : "rgba(255,255,255,0.45)",
                }}
              >
                {t === "one-time" ? "One-time" : "Recurring"}
              </button>
            ))}
          </div>

          {/* Amount row */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className="flex items-center flex-1 rounded-lg overflow-hidden"
              style={inputStyle}
            >
              <span className="pl-3 text-sm text-white/50">$</span>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                className="flex-1 bg-transparent px-2 py-2.5 text-sm text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              {form.billingType === "one-time" ? null : (
                <div className="flex items-center gap-1 pr-1">
                  <span className="text-white/40 text-sm">/</span>
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded text-sm cursor-pointer"
                    style={{ color: "white" }}
                  >
                    {form.recurringCadence}
                    <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                  </div>
                </div>
              )}
            </div>
            <div
              className="flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm cursor-pointer shrink-0"
              style={inputStyle}
            >
              <span className="text-white">{form.currency}</span>
              <ChevronDown className="w-4 h-4 text-white/40" />
            </div>
          </div>

          {/* Quick amount chips */}
          <div className="flex gap-2 mb-5">
            {chips.map((c) => (
              <button
                key={c}
                onClick={() => update("amount", c)}
                className="px-3 py-1 rounded-md text-xs font-medium"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                ${c}
              </button>
            ))}
          </div>

          {/* Advanced options */}
          <div
            className="rounded-xl overflow-hidden mb-4"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <ToggleRow
              icon={<Settings className="w-4 h-4 text-white/50" />}
              label="Advanced options"
              checked={form.advancedOptions}
              onChange={(v) => update("advancedOptions", v)}
            />
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
            <ToggleRow
              icon={<CreditCard className="w-4 h-4 text-white/50" />}
              label="Customize payment methods"
              checked={form.customPaymentMethods}
              onChange={(v) => update("customPaymentMethods", v)}
            />
          </div>

          <div className="flex-1" />

          {/* Send button */}
          <div className="flex justify-end py-4">
            <button
              disabled={!canSend}
              className="px-6 py-2.5 rounded-lg text-sm font-medium transition-opacity"
              style={{
                background: canSend ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                color: canSend ? "white" : "rgba(255,255,255,0.3)",
                cursor: canSend ? "pointer" : "not-allowed",
              }}
            >
              Send invoice
            </button>
          </div>
        </div>
      </div>

      {/* Right panel — preview */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <InvoicePreviewTabs form={form} />
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="text-sm font-semibold text-white/85 mb-2">{label}</p>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="my-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }} />;
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm text-white/80">{label}</span>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="w-10 h-[22px] rounded-full relative transition-colors"
        style={{
          background: checked ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
        }}
      >
        <span
          className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: checked ? "20px" : "3px" }}
        />
      </button>
    </div>
  );
}
