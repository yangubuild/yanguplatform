import { useState } from "react";
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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EmenuOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter("today");
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">E-Menu Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage incoming orders and track visitors</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
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
                <span className="text-xs font-medium">Today's Orders</span>
              </div>
              <p className="text-2xl font-bold">0</p>
            </Card>
            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium">Today's Revenue</span>
              </div>
              <p className="text-2xl font-bold">0</p>
            </Card>
            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Pending</span>
              </div>
              <p className="text-2xl font-bold text-warning">0</p>
            </Card>
            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">Completed Today</span>
              </div>
              <p className="text-2xl font-bold text-success">0</p>
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
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-xs">
              <X className="h-3.5 w-3.5" /> Clear Filters
            </Button>
          </div>

          {/* Orders list (empty state) */}
          <Card className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No orders yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Orders will appear here once customers start ordering from your menu.
            </p>
          </Card>
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
