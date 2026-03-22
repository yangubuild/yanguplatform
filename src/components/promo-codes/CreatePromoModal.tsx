import { useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown, Check, Search, Info, Calendar } from "lucide-react";
import type { PromoCodeFormData } from "@/pages/dashboard/PromoCodesPage";
import { useSurfaces } from "@/hooks/useSurfaces";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PromoCodeFormData) => void;
  isSubmitting: boolean;
}

// Reusable select dropdown
function DarkSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between rounded-xl px-4 h-11 text-sm text-muted-foreground border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] transition-colors">
          <span>{options.find((o) => o.value === value)?.label || value}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute z-50 mt-1 w-full rounded-xl border border-white/10 bg-[#1a2420] shadow-xl overflow-hidden">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                    value === opt.value ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:bg-white/[0.04]"
                  }`}>
                  {value === opt.value && <Check className="w-4 h-4 text-muted-foreground" />}
                  {value !== opt.value && <span className="w-4" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DarkCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 py-2 group">
      <div
        className="w-5 h-5 rounded flex items-center justify-center border transition-all shrink-0"
        style={{
          background: checked ? "#3b82f6" : "transparent",
          borderColor: checked ? "#3b82f6" : "rgba(255,255,255,0.2)" }}>
        {checked && <Check className="w-3.5 h-3.5 text-foreground" />}
      </div>
      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
    </button>
  );
}

export function CreatePromoModal({ open, onClose, onSubmit, isSubmitting }: Props) {
  const { data: surfaces = [] } = useSurfaces();
  const [affiliateOpen, setAffiliateOpen] = useState(false);
  const [affiliateSearch, setAffiliateSearch] = useState("");

  const [form, setForm] = useState<PromoCodeFormData>({
    code: "",
    discountValue: 10,
    discountType: "percentage",
    duration: "forever",
    eligibleUsers: "everyone",
    setExpiration: false,
    setMaxRedemptions: false,
    oneUsePerUser: true,
    applyToSpecificProducts: false,
    applicableProductIds: [],
  });

  const update = <K extends keyof PromoCodeFormData>(key: K, val: PromoCodeFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const publishedSurfaces = surfaces.filter(
    (s) => s.activePublishes && s.activePublishes.length> 0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    onSubmit(form);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md mx-auto rounded-2xl border border-white/10 flex flex-col"
        style={{ background: "#111a15", maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-semibold text-foreground">Create promo code</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 pb-3 space-y-5">
          {/* Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Code</label>
            <input
              type="text"
              placeholder="SUMMER_SALE"
              value={form.code}
              onChange={(e) => update("code", e.target.value.toUpperCase().replace(/\s/g, "_"))}
              className="w-full rounded-xl px-4 h-11 text-sm text-foreground placeholder:text-muted-foreground border border-white/10 bg-white/[0.04] focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Discount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Discount</label>
            <div className="relative">
              <input
                type="number"
                min={1}
                value={form.discountValue}
                onChange={(e) => update("discountValue", Number(e.target.value))}
                className="w-full rounded-xl px-4 h-11 text-sm text-foreground placeholder:text-muted-foreground border border-white/10 bg-white/[0.04] focus:outline-none focus:border-white/20 transition-colors pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {form.discountType === "percentage" ? "%" : "$"}
              </span>
            </div>
          </div>

          {/* Discount type */}
          <DarkSelect
            label=""
            value={form.discountType}
            options={[
              { value: "percentage", label: "Percentage" },
              { value: "fixed", label: "Fixed" },
            ]}
            onChange={(v) => update("discountType", v as any)}
          />

          {/* Duration */}
          <DarkSelect
            label="Discount duration"
            value={form.duration}
            options={[
              { value: "forever", label: "Forever" },
              { value: "one-time", label: "One-time" },
              { value: "multiple_months", label: "Multiple months" },
            ]}
            onChange={(v) => update("duration", v as any)}
          />

          {form.duration === "multiple_months" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Number of months</label>
              <input
                type="number"
                min={1}
                value={form.durationMonths || 1}
                onChange={(e) => update("durationMonths", Number(e.target.value))}
                className="w-full rounded-xl px-4 h-11 text-sm text-foreground border border-white/10 bg-white/[0.04] focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
          )}

          {/* Eligible users */}
          <DarkSelect
            label="Eligible users"
            value={form.eligibleUsers}
            options={[
              { value: "everyone", label: "Everyone" },
              { value: "only_new", label: "Only new" },
              { value: "only_churned", label: "Only churned" },
            ]}
            onChange={(v) => update("eligibleUsers", v as any)}
          />

          {/* Affiliate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Affiliate</span>
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <button type="button" className="text-xs text-accent hover:brightness-110">
                Set affiliate
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Select the affiliate to attach to this promo code
            </p>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAffiliateOpen(!affiliateOpen)}
                className="w-full flex items-center justify-between rounded-xl px-4 h-11 text-sm text-muted-foreground border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] transition-colors">
                <span>Search for affiliate</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
              {affiliateOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAffiliateOpen(false)} />
                  <div className="absolute z-50 mt-1 w-full rounded-xl border border-white/10 bg-[#1a2420] shadow-xl overflow-hidden p-2">
                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 h-9 mb-2">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search"
                        value={affiliateSearch}
                        onChange={(e) => setAffiliateSearch(e.target.value)}
                        className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No affiliates found
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-white/[0.06]" />

          {/* Checkboxes */}
          <div className="space-y-1">
            <DarkCheckbox
              checked={form.setExpiration}
              onChange={(v) => update("setExpiration", v)}
              label="Set expiration date"
            />
            {form.setExpiration && (
              <div className="ml-8 mt-1 mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={form.expiresAt || ""}
                    onChange={(e) => update("expiresAt", e.target.value)}
                    className="flex-1 rounded-xl px-4 h-10 text-sm text-foreground border border-white/10 bg-white/[0.04] focus:outline-none focus:border-white/20 transition-colors [color-scheme:dark]"
                  />
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            )}

            <DarkCheckbox
              checked={form.setMaxRedemptions}
              onChange={(v) => update("setMaxRedemptions", v)}
              label="Set max redemptions"
            />
            {form.setMaxRedemptions && (
              <div className="ml-8 mt-1 mb-2">
                <input
                  type="number"
                  min={1}
                  value={form.maxRedemptions || 1}
                  onChange={(e) => update("maxRedemptions", Number(e.target.value))}
                  className="w-full rounded-xl px-4 h-10 text-sm text-foreground border border-white/10 bg-white/[0.04] focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
            )}

            <DarkCheckbox
              checked={form.oneUsePerUser}
              onChange={(v) => update("oneUsePerUser", v)}
              label="Only allow one use per user"
            />

            <DarkCheckbox
              checked={form.applyToSpecificProducts}
              onChange={(v) => update("applyToSpecificProducts", v)}
              label="Apply to specific products"
            />
            {form.applyToSpecificProducts && publishedSurfaces.length> 0 && (
              <div className="ml-8 mt-1 mb-2 space-y-2">
                {publishedSurfaces.map((s) => {
                  const selected = form.applicableProductIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        update(
                          "applicableProductIds",
                          selected
                            ? form.applicableProductIds.filter((id) => id !== s.id)
                            : [...form.applicableProductIds, s.id]
                        );
                        if (!form.surfaceId) update("surfaceId", s.id);
                      }}
                      className={`w-full flex items-center gap-2 rounded-xl px-4 h-10 text-sm border transition-colors ${
                        selected
                          ? "border-accent/40 bg-accent/10 text-foreground"
                          : "border-white/10 bg-white/[0.04] text-muted-foreground hover:bg-white/[0.06]"
                      }`}>
                      <ChevronDown className="w-4 h-4" />
                      <span className="uppercase tracking-wide text-xs font-medium truncate">
                        {s.title || "Untitled"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {form.applyToSpecificProducts && publishedSurfaces.length === 0 && (
              <div className="ml-8 mt-1 mb-2">
                <p className="text-xs text-muted-foreground">No published businesses found</p>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <Button variant="accent" size="lg" disabled={isSubmitting || !form.code.trim()} onClick={handleSubmit as any} className="w-full">
            {isSubmitting ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
