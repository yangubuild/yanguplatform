/**
 * MyOrdersView — Buyer-side order history for a single live shop surface.
 * Phase 3: list of placed orders with id/status/total/date, "Track" opens
 * the existing OrderTrackingView. No map yet (Phase 4).
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Clock } from "lucide-react";
import { formatPriceCents } from "@/types/commerce";
import { loadBuyerOrdersForSurface } from "@/lib/cart/buyerOrders";
import { STATUS_META, type OrderStatus } from "./orderStatus";

interface MyOrdersViewProps {
  surfaceId: string;
  onTrackOrder: (trackingCode: string) => void;
  onBackToShop: () => void;
}

export function MyOrdersView({ surfaceId, onTrackOrder, onBackToShop }: MyOrdersViewProps) {
  const localRefs = useMemo(() => loadBuyerOrdersForSurface(surfaceId), [surfaceId]);
  const codes = useMemo(() => localRefs.map((r) => r.tracking_code), [localRefs]);

  // Re-fetch live status from the canonical orders table
  const { data: liveOrders } = useQuery({
    queryKey: ["my_orders_live", surfaceId, codes.join(",")],
    enabled: codes.length > 0,
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, tracking_code, status, total_cents, currency, created_at, order_type")
        .in("tracking_code", codes);
      if (error) throw error;
      return data || [];
    },
  });

  const merged = useMemo(() => {
    return localRefs.map((ref) => {
      const live = liveOrders?.find((o) => o.tracking_code === ref.tracking_code);
      return {
        ...ref,
        status: live?.status ?? "pending",
        order_type: live?.order_type ?? null,
      };
    });
  }, [localRefs, liveOrders]);

  if (merged.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <ShoppingBag className="h-9 w-9 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-1">No orders yet</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Your placed orders will appear here.
        </p>
        <Button onClick={onBackToShop}>Browse Menu</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-xl font-bold">My Orders</h2>

      <div className="space-y-3">
        {merged.map((order) => {
          const meta = STATUS_META[order.status] || STATUS_META.pending;
          const StatusIcon = meta.icon;
          const placed = new Date(order.placed_at);
          return (
            <button
              key={order.tracking_code}
              onClick={() => onTrackOrder(order.tracking_code)}
              className="w-full text-left rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-mono">
                    #{order.tracking_code}
                  </p>
                  <p className="text-sm font-semibold mt-0.5">
                    {order.item_count} item{order.item_count === 1 ? "" : "s"}
                    {order.business_name ? ` · ${order.business_name}` : ""}
                  </p>
                </div>
                <span className="font-bold text-sm whitespace-nowrap">
                  {formatPriceCents(order.total_cents, order.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${meta.tone}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {meta.label}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {placed.toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
