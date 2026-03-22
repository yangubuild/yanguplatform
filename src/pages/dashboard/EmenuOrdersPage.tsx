import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle2,
  Search,
  X,
  Users,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Order {
  id: string;
  tracking_code: string;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  payment_method: string | null;
  status: string;
  total_cents: number;
  currency: string;
  created_at: string;
  notes: string | null;
}

export default function EmenuOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Get user's surfaces
    const { data: surfaces } = await supabase
      .from("builder_surfaces")
      .select("id")
      .eq("user_id", user.id);

    if (!surfaces?.length) { setLoading(false); return; }

    const surfaceIds = surfaces.map((s) => s.id);
    let query = supabase
      .from("orders")
      .select("id, tracking_code, buyer_name, buyer_email, buyer_phone, payment_method, status, total_cents, currency, created_at, notes")
      .in("surface_id", surfaceIds)
      .order("created_at", { ascending: false })
      .limit(100);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.tracking_code?.toLowerCase().includes(q) ||
      o.buyer_name?.toLowerCase().includes(q) ||
      o.buyer_email?.toLowerCase().includes(q)
    );
  });

  const markAsPaid = async (orderId: string) => {
    // Update payment_attempts
    await supabase
      .from("payment_attempts")
      .update({ status: "succeeded" })
      .eq("order_id", orderId);
    // Update order
    await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId);
    toast.success("Order marked as paid");
    fetchOrders();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter("all");
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "paid": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "pending": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "awaiting_confirmation": return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6 min-h-screen bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage incoming orders and payments</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchOrders}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6 mt-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-xs font-medium">Total Orders</span>
              </div>
              <p className="text-2xl font-bold">{orders.length}</p>
            </Card>
            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{orders.filter((o) => o.status === "pending").length}</p>
            </Card>
            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium">Awaiting Confirm</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{orders.filter((o) => o.status === "awaiting_confirmation").length}</p>
            </Card>
            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">Paid</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{orders.filter((o) => o.status === "paid").length}</p>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders..."
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="awaiting_confirmation">Awaiting Confirm</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-xs">
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>

          {/* Orders list */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card className="p-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">No orders yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Orders will appear here once customers start ordering.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{order.tracking_code?.slice(0, 8)}…</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColor(order.status)}`}>
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                      {order.payment_method && (
                        <span className="text-[10px] text-muted-foreground">{order.payment_method}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground mt-1 truncate">{order.buyer_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{order.buyer_email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  {(order.status === "pending" || order.status === "awaiting_confirmation") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 shrink-0 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => markAsPaid(order.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark Paid
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="visitors" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Today's Visitors</span>
              </div>
              <p className="text-2xl font-bold">0</p>
            </Card>
            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">This Week</span>
              </div>
              <p className="text-2xl font-bold">0</p>
            </Card>
            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Total Visitors</span>
              </div>
              <p className="text-2xl font-bold">0</p>
            </Card>
          </div>

          <Card className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No visitor data yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Visitor analytics will appear once your menu is published and receiving traffic.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
