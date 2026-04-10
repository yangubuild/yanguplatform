/**
 * CommerceConfigPanel — Unified editor panel for configuring
 * ordering, delivery, payment methods, contact, and WhatsApp chat.
 * Replaces the old "Order Settings" + "Commerce & Payments" split.
 */

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShoppingCart, CreditCard, MessageCircle, Phone, Save, Loader2, Truck,
} from "lucide-react";
import { useSurfaceCommerceConfig, type CommerceConfig } from "@/hooks/useSurfaceCommerceConfig";

interface CommerceConfigPanelProps {
  surfaceId: string;
  ownerId: string;
  onClose?: () => void;
}

const CURRENCIES = [
  { value: "UGX", label: "UGX — Ugandan Shilling" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "ZAR", label: "ZAR — South African Rand" },
  { value: "TZS", label: "TZS — Tanzanian Shilling" },
  { value: "GHS", label: "GHS — Ghanaian Cedi" },
  { value: "AED", label: "AED — UAE Dirham" },
];

// Currencies that are typically whole-number (no decimals)
const WHOLE_NUMBER_CURRENCIES = ["UGX", "KES", "NGN", "TZS", "GHS"];

function centsToAmount(cents: number | null, currency: string): string {
  if (!cents) return "0";
  if (WHOLE_NUMBER_CURRENCIES.includes(currency)) {
    return String(cents / 100);
  }
  return (cents / 100).toFixed(2);
}

function amountToCents(amount: string, currency: string): number {
  const num = parseFloat(amount);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function CommerceConfigPanel({ surfaceId, ownerId, onClose }: CommerceConfigPanelProps) {
  const { config, isLoading, defaults, upsert, isSaving } = useSurfaceCommerceConfig(surfaceId);

  const [form, setForm] = useState<Omit<CommerceConfig, "id" | "surface_id" | "owner_id">>({
    ...defaults,
  });
  const [freeDelivery, setFreeDelivery] = useState(true);
  const [deliveryAmount, setDeliveryAmount] = useState("0");

  useEffect(() => {
    if (config) {
      setForm({
        ordering_enabled: config.ordering_enabled,
        order_types: config.order_types || ["delivery"],
        currency: config.currency || "UGX",
        payment_methods: config.payment_methods || ["cash"],
        mobile_money_phone: config.mobile_money_phone,
        mobile_money_provider: config.mobile_money_provider,
        mobile_money_country: config.mobile_money_country,
        stripe_enabled: config.stripe_enabled,
        paypal_enabled: config.paypal_enabled,
        support_email: config.support_email,
        support_phone: config.support_phone,
        support_whatsapp: config.support_whatsapp,
        whatsapp_enabled: config.whatsapp_enabled,
        whatsapp_default_message: config.whatsapp_default_message,
        min_order_value_cents: config.min_order_value_cents,
        delivery_fee_cents: config.delivery_fee_cents,
      });
      const fee = config.delivery_fee_cents ?? 0;
      setFreeDelivery(fee === 0);
      setDeliveryAmount(centsToAmount(fee, config.currency || "UGX"));
    }
  }, [config]);

  const toggleOrderType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      order_types: prev.order_types.includes(type)
        ? prev.order_types.filter((t) => t !== type)
        : [...prev.order_types, type],
    }));
  };

  const togglePaymentMethod = (method: string) => {
    setForm((prev) => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter((m) => m !== method)
        : [...prev.payment_methods, method],
    }));
  };

  const handleSave = async () => {
    try {
      const deliveryCents = freeDelivery ? 0 : amountToCents(deliveryAmount, form.currency);
      await upsert({
        surface_id: surfaceId,
        owner_id: ownerId,
        ...form,
        delivery_fee_cents: deliveryCents,
      });
    } catch {
      // Error handled in hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currencyLabel = CURRENCIES.find(c => c.value === form.currency)?.value || form.currency;

  return (
    <div className="space-y-6 p-4 overflow-y-auto max-h-[calc(100vh-120px)]">
      {/* ── Ordering Toggle ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <Label className="font-semibold">Enable Ordering</Label>
        </div>
        <Switch
          checked={form.ordering_enabled}
          onCheckedChange={(v) => setForm((p) => ({ ...p, ordering_enabled: v }))}
        />
      </div>

      {form.ordering_enabled && (
        <>
          {/* ── Order Types ── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Order Types</Label>
            </div>
            <div className="space-y-2">
              {[
                { key: "dine_in", label: "Dine In" },
                { key: "takeaway", label: "Takeaway" },
                { key: "delivery", label: "Delivery" },
              ].map((type) => (
                <label key={type.key} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={form.order_types.includes(type.key)}
                    onCheckedChange={() => toggleOrderType(type.key)}
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Currency ── */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Currency</Label>
            <Select value={form.currency} onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Delivery Fee ── */}
          {form.order_types.includes("delivery") && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold block">Delivery Fee</Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={freeDelivery}
                  onCheckedChange={(v) => {
                    setFreeDelivery(!!v);
                    if (v) setDeliveryAmount("0");
                  }}
                />
                <span className="text-sm">Free delivery</span>
              </label>
              {!freeDelivery && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">{currencyLabel}</span>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    step={WHOLE_NUMBER_CURRENCIES.includes(form.currency) ? "100" : "0.01"}
                    value={deliveryAmount}
                    onChange={(e) => setDeliveryAmount(e.target.value)}
                    className="flex-1"
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Payment Methods ── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Payment Methods</Label>
            </div>
            <div className="space-y-2">
              {[
                { key: "cash", label: "Cash on Delivery" },
                { key: "mobile_money", label: "Mobile Money" },
                { key: "card", label: "Card / Stripe" },
                { key: "paypal", label: "PayPal" },
              ].map((method) => (
                <label key={method.key} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={form.payment_methods.includes(method.key)}
                    onCheckedChange={() => togglePaymentMethod(method.key)}
                  />
                  <span className="text-sm">{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Mobile Money Config */}
          {form.payment_methods.includes("mobile_money") && (
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <Label className="text-xs font-semibold text-muted-foreground">Mobile Money Settings</Label>
              <Input
                placeholder="Mobile Money Number *"
                value={form.mobile_money_phone || ""}
                onChange={(e) => setForm((p) => ({ ...p, mobile_money_phone: e.target.value }))}
              />
              <Input
                placeholder="Registered Name"
                value={form.mobile_money_provider || ""}
                onChange={(e) => setForm((p) => ({ ...p, mobile_money_provider: e.target.value }))}
              />
              <Input
                placeholder="Country (e.g. Uganda)"
                value={form.mobile_money_country || ""}
                onChange={(e) => setForm((p) => ({ ...p, mobile_money_country: e.target.value }))}
              />
            </div>
          )}
        </>
      )}

      {/* ── WhatsApp Chat ── */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-green-500" />
            <Label className="font-semibold">WhatsApp Live Chat</Label>
          </div>
          <Switch
            checked={form.whatsapp_enabled}
            onCheckedChange={(v) => setForm((p) => ({ ...p, whatsapp_enabled: v }))}
          />
        </div>
        {form.whatsapp_enabled && (
          <div className="space-y-2">
            <Input
              placeholder="WhatsApp number (e.g. +256700000000)"
              value={form.support_whatsapp || ""}
              onChange={(e) => setForm((p) => ({ ...p, support_whatsapp: e.target.value }))}
            />
            <Input
              placeholder="Default message"
              value={form.whatsapp_default_message || ""}
              onChange={(e) => setForm((p) => ({ ...p, whatsapp_default_message: e.target.value }))}
            />
          </div>
        )}
      </div>

      {/* ── Support Contact ── */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <Label className="font-semibold">Support Contact</Label>
        </div>
        <div className="space-y-2">
          <Input
            placeholder="Support email"
            type="email"
            value={form.support_email || ""}
            onChange={(e) => setForm((p) => ({ ...p, support_email: e.target.value }))}
          />
          <Input
            placeholder="Support phone"
            type="tel"
            value={form.support_phone || ""}
            onChange={(e) => setForm((p) => ({ ...p, support_phone: e.target.value }))}
          />
        </div>
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Commerce Settings
      </Button>
    </div>
  );
}
