/**
 * CheckoutDialog — Full checkout flow for surface orders.
 * Supports dine_in, takeaway, delivery order types.
 * Payment method selection based on owner config.
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { formatPriceCents } from "@/types/commerce";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CommerceAuthSheet } from "@/components/commerce/CommerceAuthSheet";
import type { CartItem } from "@/lib/cart/cartStore";

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: string;
  totalCents: number;
  surfaceId: string;
  ownerId: string;
  orderTypes: string[];
  paymentMethods: string[];
  deliveryFeeCents: number;
  supportPhone?: string | null;
  supportEmail?: string | null;
  supportWhatsapp?: string | null;
  onOrderPlaced: (trackingCode: string, info?: {
    paymentMethod: string;
    orderId: string;
    buyerUserId: string | null;
  }) => void;
}

type OrderType = "delivery" | "takeaway" | "dine_in";

export function CheckoutDialog({
  open, onClose, items, currency, totalCents, surfaceId, ownerId,
  orderTypes, paymentMethods, deliveryFeeCents, supportPhone, supportEmail,
  supportWhatsapp, onOrderPlaced,
}: CheckoutDialogProps) {
  const [orderType, setOrderType] = useState<OrderType>(
    (orderTypes[0] as OrderType) || "delivery"
  );
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0] || "cash");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const isDelivery = orderType === "delivery";
  const grandTotal = totalCents + (isDelivery ? deliveryFeeCents : 0);

  const ORDER_TYPE_LABELS: Record<string, { label: string; description: string }> = {
    dine_in: { label: "Dine In", description: "Eat at the restaurant" },
    takeaway: { label: "Takeaway", description: "Pick up your order" },
    delivery: { label: "Delivery", description: "Get it delivered to your location" },
  };

  const PAYMENT_LABELS: Record<string, { label: string; description: string }> = {
    cash: { label: "Cash", description: "Pay with cash on delivery" },
    mobile_money: { label: "Mobile Money", description: "Pay with MTN or Airtel Money" },
    card: { label: "Card/Stripe", description: "Pay with credit or debit card" },
    paypal: { label: "PayPal", description: "Pay with your PayPal account" },
  };

  const handlePlaceOrder = async () => {
    if (!buyerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!buyerPhone.trim() && !buyerEmail.trim()) {
      toast.error("Please enter a phone number or email");
      return;
    }
    if (isDelivery && !address.trim()) {
      toast.error("Please enter a delivery address");
      return;
    }

    // Phase 2: require auth before submitting the order. Cart is preserved
    // in localStorage so it survives the auth handoff.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setAuthOpen(true);
      return;
    }

    await submitOrder();
  };

  const submitOrder = async () => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const buyerUserId = session?.user?.id ?? null;
      // Create order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          surface_id: surfaceId,
          owner_id: ownerId,
          order_type: orderType,
          status: "pending",
          buyer_name: buyerName.trim(),
          buyer_email: buyerEmail.trim() || null,
          buyer_phone: buyerPhone.trim() || null,
          buyer_address: isDelivery ? address.trim() : null,
          notes: notes.trim() || null,
          total_cents: grandTotal,
          currency,
          payment_method: paymentMethod,
          buyer_user_id: buyerUserId,
          payment_status: paymentMethod === "cash" ? "cod" : "unpaid",
        })
        .select("id, tracking_code")
        .single();

      if (orderErr) throw orderErr;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_name: item.name,
        variant: item.variant || null,
        quantity: item.quantity,
        unit_price_cents: item.price_cents,
      }));

      const { error: itemsErr } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsErr) throw itemsErr;

      // Seed buyer↔seller DM thread with order context (best-effort).
      if (buyerUserId && ownerId && buyerUserId !== ownerId) {
        try {
          await (supabase.from("direct_messages" as any).insert({
            sender_id: buyerUserId,
            receiver_id: ownerId,
            content: `Hi! I just placed order ${order.tracking_code}. Looking forward to it!`,
          } as any));
        } catch (e) {
          console.warn("Could not seed order chat:", e);
        }
      }

      // Card / Stripe: redirect to Stripe Checkout instead of success dialog.
      if (paymentMethod === "card") {
        const { data, error } = await supabase.functions.invoke("stripe-checkout", {
          body: {
            order_id: order.id,
            success_url: `${window.location.origin}${window.location.pathname}?stripe=success&order=${order.tracking_code}`,
            cancel_url: `${window.location.origin}${window.location.pathname}?stripe=cancel`,
          },
        });
        if (error || !(data as any)?.url) {
          console.error("stripe-checkout failed:", error, data);
          toast.error("Card payment unavailable. Try another method.");
          return;
        }
        window.location.href = (data as any).url;
        return;
      }

      onOrderPlaced(order.tracking_code, {
        paymentMethod,
        orderId: order.id,
        buyerUserId,
      });
    } catch (err: any) {
      console.error("Order placement failed:", err);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Order Type */}
          {orderTypes.length > 1 && (
            <div>
              <Label className="text-base font-semibold mb-3 block">Order Type</Label>
              <RadioGroup value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                <div className="space-y-2">
                  {orderTypes.map((type) => {
                    const info = ORDER_TYPE_LABELS[type];
                    if (!info) return null;
                    return (
                      <label
                        key={type}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          orderType === type ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value={type} />
                        <div>
                          <p className="font-medium text-sm">{info.label}</p>
                          <p className="text-xs text-muted-foreground">{info.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Delivery Address */}
          {isDelivery && (
            <div>
              <Label className="text-base font-semibold mb-2 block">Delivery Address *</Label>
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => setAddress(`${pos.coords.latitude}, ${pos.coords.longitude}`),
                      () => toast.error("Could not get location")
                    );
                  }
                }}
                className="flex items-center gap-2 w-full p-2.5 mb-2 rounded-lg border hover:bg-muted/50 text-sm"
              >
                <MapPin className="h-4 w-4" />
                Use Current Location
              </button>
              <Textarea
                placeholder="Enter your full delivery address..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* Contact Details */}
          <div className="space-y-3">
            <Label className="text-base font-semibold block">Contact Details</Label>
            <Input
              placeholder="Your name *"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
            />
            <Input
              placeholder="Phone number"
              type="tel"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
            />
            <Input
              placeholder="Email (optional)"
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
            />
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-2">
                {paymentMethods.map((method) => {
                  const info = PAYMENT_LABELS[method];
                  if (!info) return null;
                  return (
                    <label
                      key={method}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        paymentMethod === method ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem value={method} />
                      <div>
                        <p className="font-medium text-sm">{info.label}</p>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Special Instructions */}
          <div>
            <Label className="text-base font-semibold mb-2 block">Special Instructions (Optional)</Label>
            <Textarea
              placeholder="Add any special requests or dietary requirements..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Order Summary */}
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-bold">Order Summary</h3>
            {items.map((item) => (
              <div key={`${item.id}-${item.variant || ""}`} className="flex justify-between text-sm">
                <span>{item.name} x{item.quantity}</span>
                <span className="font-medium">{formatPriceCents(item.price_cents * item.quantity, currency)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPriceCents(totalCents, currency)}</span>
              </div>
              {isDelivery && deliveryFeeCents > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee</span>
                  <span>{formatPriceCents(deliveryFeeCents, currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span>
                <span>{formatPriceCents(grandTotal, currency)}</span>
              </div>
            </div>
          </div>

          {/* Place Order */}
          <Button
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Placing Order...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-2" /> Place Order</>
            )}
          </Button>

          {/* Support info */}
          {(supportPhone || supportEmail) && (
            <div className="text-center text-xs text-muted-foreground space-y-1">
              <p>Need help?</p>
              {supportPhone && <p>📞 {supportPhone}</p>}
              {supportEmail && <p>✉️ {supportEmail}</p>}
            </div>
          )}
        </div>
      </DialogContent>

      <CommerceAuthSheet
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthed={() => {
          setAuthOpen(false);
          // Re-verify session, then resume order placement.
          // Small delay lets auth state propagate to the PostgREST client.
          setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              toast.error("Session not ready yet — please tap Place Order again.");
              return;
            }
            await submitOrder();
          }, 150);
        }}
      />
    </Dialog>
  );
}
