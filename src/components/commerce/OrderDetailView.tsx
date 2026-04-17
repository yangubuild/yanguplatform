/**
 * OrderDetailView — Phase 5 lightweight order detail screen.
 * Shows items, total, status, timestamp, and a "Contact Support" CTA
 * that opens WhatsApp prefilled with order reference + business name.
 *
 * Intentionally minimal — no map, no live timeline (Phase 6+).
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, Phone, Mail, Copy, Clock } from "lucide-react";
import { formatPriceCents } from "@/types/commerce";
import { toast } from "sonner";
import { STATUS_META, type OrderStatus } from "./orderStatus";

interface OrderDetailViewProps {
  trackingCode: string;
  businessName?: string;
  supportPhone?: string | null;
  supportEmail?: string | null;
  supportWhatsapp?: string | null;
}

export function OrderDetailView({
  trackingCode,
  businessName,
  supportPhone,
  supportEmail,
  supportWhatsapp,
}: OrderDetailViewProps) {
  const { data: order, isLoading } = useQuery({
    queryKey: ["order_detail", trackingCode],
    enabled: !!trackingCode,
    staleTime: 10_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("tracking_code", trackingCode)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const copyCode = () => {
    navigator.clipboard.writeText(trackingCode);
    toast.success("Tracking code copied");
  };

  const buildSupportMsg = () => {
    const biz = businessName ? ` ${businessName}` : "";
    return `Hi${biz}, I need help with my order #${trackingCode}.`;
  };

  const openWhatsApp = () => {
    if (!supportWhatsapp) return;
    const phone = supportWhatsapp.replace(/[^0-9+]/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildSupportMsg())}`, "_blank");
  };

  const callPhone = () => {
    if (!supportPhone) return;
    window.location.href = `tel:${supportPhone}`;
  };

  const emailSupport = () => {
    if (!supportEmail) return;
    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(
      `Order #${trackingCode}`
    )}&body=${encodeURIComponent(buildSupportMsg())}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-sm text-muted-foreground">Order not found.</p>
      </div>
    );
  }

  const status = (order.status || "pending") as OrderStatus;
  const meta = STATUS_META[status] || STATUS_META.pending;
  const StatusIcon = meta.icon;
  const placed = new Date(order.created_at);
  const hasSupport = !!(supportWhatsapp || supportPhone || supportEmail);

  return (
    <div className="max-w-md mx-auto p-4 pb-8 space-y-4">
      {/* Header card */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Order</p>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 font-mono text-sm font-semibold text-foreground hover:underline"
            >
              #{trackingCode}
              <Copy className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.badgeClass}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {placed.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <h3 className="font-semibold text-sm mb-2">Items</h3>
        {(order as any).order_items?.length ? (
          (order as any).order_items.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm gap-3">
              <span className="min-w-0 truncate">
                {item.product_name}{" "}
                <span className="text-muted-foreground">× {item.quantity}</span>
              </span>
              <span className="whitespace-nowrap font-medium">
                {formatPriceCents(item.unit_price_cents * item.quantity, order.currency)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">No items recorded.</p>
        )}
        <div className="border-t border-border pt-2 flex justify-between font-bold text-sm">
          <span>Total</span>
          <span>{formatPriceCents(order.total_cents, order.currency)}</span>
        </div>
      </div>

      {/* Support entry */}
      {hasSupport && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-sm">Need help?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Contact {businessName || "the shop"} about this order.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {supportWhatsapp && (
              <Button
                onClick={openWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white"
                size="sm"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat on WhatsApp
              </Button>
            )}
            {supportPhone && (
              <Button onClick={callPhone} variant="outline" size="sm" className="w-full">
                <Phone className="h-4 w-4 mr-2" />
                Call {supportPhone}
              </Button>
            )}
            {supportEmail && (
              <Button onClick={emailSupport} variant="outline" size="sm" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Email support
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
