import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShoppingBag, Banknote, CreditCard, Smartphone, DollarSign, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentMethod {
  enabled: boolean;
  bank_name?: string;
  account_name?: string;
  provider?: string;
  number?: string;
  name?: string;
  email?: string;
}

type MethodsMap = Record<string, PaymentMethod>;

const METHOD_META: Record<string, { label: string; icon: typeof Banknote }> = {
  cod: { label: "Cash on Delivery", icon: Banknote },
  bank: { label: "Bank Transfer", icon: CreditCard },
  mobile_money: { label: "Mobile Money", icon: Smartphone },
  paypal: { label: "PayPal", icon: DollarSign },
};

export default function EshopCheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const surfaceId = params.get("surface");
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<MethodsMap>({});
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<{ id: string; tracking_code: string } | null>(null);

  // Buyer fields
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!surfaceId) { setLoading(false); return; }
    (async () => {
      // Get surface owner
      const { data: surface } = await supabase
        .from("builder_surfaces")
        .select("user_id, metadata")
        .eq("id", surfaceId)
        .maybeSingle();
      if (!surface) { setLoading(false); return; }
      setCreatorId(surface.user_id);

      // Fetch payment methods via RPC
      const { data: pm } = await supabase.rpc("get_creator_payment_methods", {
        p_creator_id: surface.user_id,
      });
      if (pm && typeof pm === "object") {
        setMethods(pm as unknown as MethodsMap);
      }
      setLoading(false);
    })();
  }, [surfaceId]);

  const enabledMethods = Object.entries(methods).filter(([, v]) => v.enabled);

  const handlePlaceOrder = async () => {
    if (!selectedMethod || !surfaceId || !buyerName.trim() || !buyerEmail.trim()) {
      toast.error("Please fill required fields and select a payment method");
      return;
    }
    setSubmitting(true);

    // Generate tracking code
    const trackingCode = Array.from(crypto.getRandomValues(new Uint8Array(9)))
      .map((b) => b.toString(16).padStart(2, "0")).join("");

    // Insert order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        surface_id: surfaceId,
        buyer_name: buyerName.trim(),
        buyer_email: buyerEmail.trim(),
        buyer_phone: buyerPhone.trim() || null,
        buyer_address: buyerAddress.trim() || null,
        notes: notes.trim() || null,
        payment_method: selectedMethod,
        tracking_code: trackingCode,
        status: "pending",
        total_cents: 0,
        currency: "USD",
      })
      .select("id, tracking_code")
      .single();

    if (orderErr || !order) {
      toast.error("Failed to place order");
      setSubmitting(false);
      return;
    }

    // Create payment attempt
    await supabase.from("payment_attempts").insert({
      order_id: order.id,
      provider: selectedMethod,
      status: selectedMethod === "cod" ? "pending" : "initiated",
      meta: methods[selectedMethod] || {},
    });

    setOrderPlaced(order);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!surfaceId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground">Missing surface reference.</p>
      </div>
    );
  }

  // Order placed — show confirmation + instructions
  if (orderPlaced) {
    const methodInfo = methods[selectedMethod!];
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 space-y-5 text-center">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Order Placed!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tracking code: <span className="font-mono font-semibold text-foreground">{orderPlaced.tracking_code}</span>
            </p>
          </div>

          {selectedMethod === "cod" && (
            <div className="text-left rounded-lg bg-muted/50 p-4 space-y-1">
              <p className="text-sm font-semibold">💰 Pay on Delivery</p>
              <p className="text-xs text-muted-foreground">Please have the exact amount ready when your order arrives.</p>
            </div>
          )}

          {selectedMethod === "bank" && methodInfo && (
            <div className="text-left rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-semibold">🏦 Bank Transfer Instructions</p>
              {methodInfo.bank_name && <p className="text-xs"><span className="text-muted-foreground">Bank:</span> {methodInfo.bank_name}</p>}
              {methodInfo.account_name && <p className="text-xs"><span className="text-muted-foreground">Account:</span> {methodInfo.account_name}</p>}
            </div>
          )}

          {selectedMethod === "mobile_money" && methodInfo && (
            <div className="text-left rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-semibold">📱 Mobile Money</p>
              {methodInfo.provider && <p className="text-xs"><span className="text-muted-foreground">Provider:</span> {methodInfo.provider}</p>}
              {methodInfo.name && <p className="text-xs"><span className="text-muted-foreground">Name:</span> {methodInfo.name}</p>}
              {methodInfo.number && <p className="text-xs"><span className="text-muted-foreground">Number:</span> {methodInfo.number}</p>}
            </div>
          )}

          {selectedMethod === "paypal" && methodInfo && (
            <div className="text-left rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-semibold">🅿️ PayPal</p>
              {methodInfo.email && <p className="text-xs"><span className="text-muted-foreground">Send to:</span> {methodInfo.email}</p>}
            </div>
          )}

          {selectedMethod !== "cod" && (
            <Button
              variant="accent"
              className="w-full"
              onClick={async () => {
                await supabase.from("orders").update({ status: "awaiting_confirmation" }).eq("id", orderPlaced.id);
                toast.success("Payment noted — the seller will confirm shortly.");
              }}>
              I have paid
            </Button>
          )}

          <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
            Back to store
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-6 space-y-6">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Checkout</h1>
        </div>

        {/* Buyer info */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Name *</Label>
            <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Your name" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email *</Label>
            <Input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="email@example.com" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Phone</Label>
            <Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="+256 ..." className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Address</Label>
            <Input value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} placeholder="Delivery address" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Special Instructions</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes for the seller..." rows={2} className="text-sm" />
          </div>
        </div>

        {/* Payment methods */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Payment Method</Label>
          {enabledMethods.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No payment methods configured by seller.
            </p>
          ) : (
            <div className="grid gap-2">
              {enabledMethods.map(([key]) => {
                const meta = METHOD_META[key] || { label: key, icon: Banknote };
                const Icon = meta.icon;
                const isSelected = selectedMethod === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedMethod(key)}
                    className={`flex items-center gap-3 w-full rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}>
                    <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Button
          variant="accent"
          className="w-full"
          disabled={submitting || !selectedMethod || !buyerName.trim() || !buyerEmail.trim()}
          onClick={handlePlaceOrder}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Place Order
        </Button>
      </Card>
    </div>
  );
}
