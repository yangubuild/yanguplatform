/**
 * OwnerOrdersPanel — Owner-side order management.
 * Shows orders for a surface with status management.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Clock, RefreshCw, MessagesSquare, CheckCircle2 } from "lucide-react";
import { formatPriceCents } from "@/types/commerce";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  { value: "preparing", label: "Preparing", color: "bg-orange-100 text-orange-800" },
  { value: "out_for_delivery", label: "Out for Delivery", color: "bg-purple-100 text-purple-800" },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
  { value: "completed", label: "Completed", color: "bg-emerald-100 text-emerald-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
];

interface OwnerOrdersPanelProps {
  surfaceId: string;
}

export function OwnerOrdersPanel({ surfaceId }: OwnerOrdersPanelProps) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const queryKey = ["owner_orders", surfaceId];

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("surface_id", surfaceId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Order status updated");
    },
    onError: () => toast.error("Failed to update order status"),
  });

  const markPaid = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: "paid", status: "confirmed" } as any)
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Marked as paid & confirmed");
    },
    onError: () => toast.error("Failed to mark paid"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusColor = (status: string) =>
    STATUS_OPTIONS.find((s) => s.value === status)?.color || "bg-muted text-muted-foreground";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Package className="h-5 w-5" /> Orders
        </h2>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {!orders?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <div key={order.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <code className="text-xs font-mono text-muted-foreground">{order.tracking_code}</code>
                  <p className="font-medium text-sm">{order.buyer_name || "Guest"}</p>
                </div>
                <Badge className={statusColor(order.status)}>
                  {STATUS_OPTIONS.find((s) => s.value === order.status)?.label || order.status}
                </Badge>
              </div>

              {/* Items */}
              <div className="text-xs space-y-1">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span>{formatPriceCents(item.unit_price_cents * item.quantity, order.currency)}</span>
                  </div>
                ))}
                <div className="border-t pt-1 font-semibold flex justify-between">
                  <span>Total</span>
                  <span>{formatPriceCents(order.total_cents, order.currency)}</span>
                </div>
              </div>

              {/* Contact & Details */}
              <div className="text-xs text-muted-foreground space-y-0.5">
                {order.buyer_phone && <p>📞 {order.buyer_phone}</p>}
                {order.buyer_email && <p>✉️ {order.buyer_email}</p>}
                {order.buyer_address && <p>📍 {order.buyer_address}</p>}
                {order.order_type && <p>🏷️ {order.order_type}</p>}
                {order.payment_method && (
                  <p>💳 {order.payment_method} · {order.payment_status || "unpaid"}</p>
                )}
                {order.notes && <p>📝 {order.notes}</p>}
                <p>🕐 {format(new Date(order.created_at), "MMM d, yyyy h:mm a")}</p>
              </div>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2">
                {order.buyer_user_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => navigate(`/dashboard/messages?tab=chats&user=${order.buyer_user_id}`)}
                  >
                    <MessagesSquare className="h-3.5 w-3.5" /> Chat with buyer
                  </Button>
                )}
                {order.payment_method === "mobile_money" && order.payment_status !== "paid" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => markPaid.mutate(order.id)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark payment received
                  </Button>
                )}
              </div>

              {/* Status Update */}
              <Select
                value={order.status}
                onValueChange={(v) => updateStatus.mutate({ orderId: order.id, status: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
