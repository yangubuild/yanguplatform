import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  DollarSign,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
  Star,
  Crown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const mockPackages = [
  {
    id: "1",
    name: "Starter",
    price: 0,
    currency: "UGX",
    interval: "month",
    members: 5,
    features: ["Community Access", "Basic Resources", "Email Support"],
    active: true,
    isFree: true,
  },
  {
    id: "2",
    name: "Growth",
    price: 50000,
    currency: "UGX",
    interval: "month",
    members: 3,
    features: ["All Starter features", "Live Sessions", "1-on-1 Mentoring", "Priority Support"],
    active: true,
    isFree: false,
  },
  {
    id: "3",
    name: "Pro",
    price: 150000,
    currency: "UGX",
    interval: "month",
    members: 1,
    features: ["All Growth features", "Custom Branding", "Analytics Dashboard", "API Access", "Dedicated Manager"],
    active: false,
    isFree: false,
  },
];

export default function AgencyPricingPage() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6 min-h-screen bg-background" >
      <button
        onClick={() => navigate("/dashboard/agency")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Agency Management
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}>
            Pricing & Packages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up subscription packages for your organization members.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Package
        </Button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockPackages.map((pkg) => (
          <Card key={pkg.id} className={`border border-border relative ${!pkg.active ? "opacity-60" : ""}`}>
            {pkg.name === "Growth" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground text-xs">
                  <Star className="w-3 h-3 mr-1" /> Most Popular
                </Badge>
              </div>
            )}
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {pkg.isFree ? (
                    <Users className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Crown className="w-5 h-5 text-primary" />
                  )}
                  <h3 className="font-semibold text-foreground">{pkg.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={pkg.active} />
                </div>
              </div>

              <div>
                {pkg.isFree ? (
                  <p className="text-3xl font-bold text-foreground">Free</p>
                ) : (
                  <div>
                    <span className="text-3xl font-bold text-foreground">
                      {pkg.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      {pkg.currency}/{pkg.interval}
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {pkg.members} member{pkg.members !== 1 ? "s" : ""} subscribed
                </p>
              </div>

              <ul className="space-y-2">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                {!pkg.isFree && (
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Summary */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Revenue Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Monthly Revenue</p>
              <p className="text-2xl font-bold text-foreground mt-1">UGX 300,000</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Active Subscribers</p>
              <p className="text-2xl font-bold text-foreground mt-1">4</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Avg. Revenue per Member</p>
              <p className="text-2xl font-bold text-foreground mt-1">UGX 75,000</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Package Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Create Package
            </DialogTitle>
            <DialogDescription>Define a new subscription package for your members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Package Name</label>
              <Input placeholder="e.g. Premium, Enterprise, VIP" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Price</label>
                <Input type="number" placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Billing Interval</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Monthly" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="quarter">Quarterly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                    <SelectItem value="once">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Description</label>
              <Textarea placeholder="Describe what this package includes..." rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Features (one per line)</label>
              <Textarea placeholder="Community Access&#10;Live Sessions&#10;Priority Support" rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => setCreateOpen(false)}>
              <Plus className="w-4 h-4 mr-2" /> Create Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
