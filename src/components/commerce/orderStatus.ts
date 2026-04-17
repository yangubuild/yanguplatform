/**
 * Shared order-status metadata used by MyOrdersView and OrderDetailView.
 * Single source of truth for label, icon, and badge color per status.
 */
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  Truck,
  Package,
} from "lucide-react";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled";

export const STATUS_META: Record<
  OrderStatus,
  { label: string; icon: any; tone: string; badgeClass: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    tone: "text-amber-600",
    badgeClass: "bg-amber-100 text-amber-800",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    tone: "text-blue-600",
    badgeClass: "bg-blue-100 text-blue-800",
  },
  preparing: {
    label: "Preparing",
    icon: ChefHat,
    tone: "text-blue-600",
    badgeClass: "bg-blue-100 text-blue-800",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    icon: Truck,
    tone: "text-indigo-600",
    badgeClass: "bg-indigo-100 text-indigo-800",
  },
  delivered: {
    label: "Delivered",
    icon: Package,
    tone: "text-green-700",
    badgeClass: "bg-green-100 text-green-800",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    tone: "text-green-700",
    badgeClass: "bg-green-100 text-green-800",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    tone: "text-destructive",
    badgeClass: "bg-destructive/10 text-destructive",
  },
};

export const FALLBACK_STATUS: OrderStatus = "pending";

export { ShoppingBag };
