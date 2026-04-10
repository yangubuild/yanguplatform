/**
 * OrderTrackingView — Visitor-facing order status tracker.
 * Supports tracking by code lookup.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle2, Clock, Truck, Package, XCircle, ChefHat, ShoppingBag } from "lucide-react";
import { formatPriceCents } from "@/types/commerce";
import type { LucideIcon } from "lucide-react";

const ORDER_STATUSES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "pending", label: "Order Placed", icon: ShoppingBag },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Package },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
];

const CANCELLED_STATUS = { key: "cancelled", label: "Cancelled", icon: XCircle };

interface OrderTrackingViewProps {
  initialTrackingCode?: string;
}

export function OrderTrackingView({ initialTrackingCode }: OrderTrackingViewProps) {
  const [code, setCode] = useState(initialTrackingCode || "");
  const [searchCode, setSearchCode] = useState(initialTrackingCode || "");

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order_tracking", searchCode],
    enabled: !!searchCode,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("tracking_code", searchCode)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handleSearch = () => {
    if (code.trim()) setSearchCode(code.trim());
  };

  const isCancelled = order?.status === "cancelled";
  const currentStatusIndex = ORDER_STATUSES.findIndex((s) => s.key === order?.status);

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <h2 className="text-xl font-bold">Track Your Order</h2>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Enter tracking code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Looking up order...</p>}
      {error && <p className="text-sm text-destructive">Could not find order</p>}
      {searchCode && !isLoading && !order && <p className="text-sm text-muted-foreground">No order found with that code</p>}

      {order && (
        <div className="space-y-4">
          {/* Status Timeline */}
          <div className="space-y-0">
            {isCancelled ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
                <span className="font-medium text-destructive">Order Cancelled</span>
              </div>
            ) : (
              ORDER_STATUSES.map((status, idx) => {
                const isActive = idx <= currentStatusIndex;
                const isCurrent = idx === currentStatusIndex;
                const StatusIcon = status.icon;
                return (
                  <div key={status.key} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      } ${isCurrent ? "ring-2 ring-primary/30" : ""}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      {idx < ORDER_STATUSES.length - 1 && (
                        <div className={`w-0.5 h-6 ${isActive ? "bg-primary" : "bg-muted"}`} />
                      )}
                    </div>
                    <span className={`text-sm ${isActive ? "font-medium" : "text-muted-foreground"}`}>
                      {status.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Order Details */}
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">Order Details</h3>
            {(order as any).order_items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.product_name} x{item.quantity}</span>
                <span>{formatPriceCents(item.unit_price_cents * item.quantity, order.currency)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>{formatPriceCents(order.total_cents, order.currency)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
