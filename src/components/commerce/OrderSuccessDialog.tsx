/**
 * OrderSuccessDialog — Shown after successful order placement.
 * Provides tracking code, contact actions (WhatsApp, Email, Phone).
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageCircle, Mail, Phone, Copy, ListOrdered, ShoppingBag, Smartphone, MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface OrderSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  trackingCode: string;
  supportPhone?: string | null;
  supportEmail?: string | null;
  supportWhatsapp?: string | null;
  businessName?: string;
  onViewMyOrders?: () => void;
  onBackToShop?: () => void;
  paymentMethod?: string;
  mobileMoney?: {
    phone?: string | null;
    name?: string | null;
    provider?: string | null;
  } | null;
  sellerId?: string | null;
  buyerUserId?: string | null;
}

export function OrderSuccessDialog({
  open, onClose, trackingCode, supportPhone, supportEmail, supportWhatsapp, businessName,
  onViewMyOrders, onBackToShop, paymentMethod, mobileMoney, sellerId, buyerUserId,
}: OrderSuccessDialogProps) {
  const navigate = useNavigate();
  const copyCode = () => {
    navigator.clipboard.writeText(trackingCode);
    toast.success("Tracking code copied!");
  };
  const copyMm = (val: string) => {
    navigator.clipboard.writeText(val);
    toast.success("Copied!");
  };

  const openWhatsApp = () => {
    if (!supportWhatsapp) return;
    const phone = supportWhatsapp.replace(/[^0-9+]/g, "");
    const msg = encodeURIComponent(`Hi${businessName ? ` ${businessName}` : ""}! I just placed an order. My tracking code is: ${trackingCode}`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="sr-only">Order Placed</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>

          <div>
            <h2 className="text-xl font-bold">Order Placed!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your order has been submitted successfully.
            </p>
          </div>

          <div className="w-full bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Tracking Code</p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-lg font-mono font-bold tracking-wider">{trackingCode}</code>
              <button onClick={copyCode} className="p-1 rounded hover:bg-background">
                <Copy className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {paymentMethod === "mobile_money" && mobileMoney?.phone && (
            <div className="w-full rounded-lg border border-primary/30 bg-primary/5 p-3 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Send Mobile Money to:</p>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Number</span>
                  <button onClick={() => copyMm(mobileMoney.phone!)} className="font-mono font-semibold hover:underline">
                    {mobileMoney.phone} <Copy className="inline h-3 w-3 ml-1" />
                  </button>
                </div>
                {mobileMoney.name && (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-semibold">{mobileMoney.name}</span>
                  </div>
                )}
                {mobileMoney.provider && (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-semibold">{mobileMoney.provider}</span>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground pt-2">
                  Include <strong>{trackingCode}</strong> as the reference. The seller will confirm when received.
                </p>
              </div>
            </div>
          )}

          {buyerUserId && sellerId && buyerUserId !== sellerId && (
            <Button
              variant="default"
              className="w-full gap-2"
              onClick={() => navigate(`/dashboard/messages?tab=chats&user=${sellerId}`)}
            >
              <MessagesSquare className="h-4 w-4" />
              Message seller about this order
            </Button>
          )}

          <div className="w-full space-y-2 pt-2">
            <p className="text-xs text-muted-foreground font-medium">Contact the seller:</p>

            {supportWhatsapp && (
              <Button variant="outline" className="w-full gap-2" onClick={openWhatsApp}>
                <MessageCircle className="h-4 w-4 text-green-600" />
                WhatsApp
              </Button>
            )}

            {supportPhone && (
              <Button variant="outline" className="w-full gap-2" asChild>
                <a href={`tel:${supportPhone}`}>
                  <Phone className="h-4 w-4" />
                  Call {supportPhone}
                </a>
              </Button>
            )}

          {supportEmail && (
              <Button variant="outline" className="w-full gap-2" asChild>
                <a href={`mailto:${supportEmail}?subject=Order ${trackingCode}&body=${encodeURIComponent(`Hi${businessName ? ` ${businessName}` : ""},\n\nI just placed an order with tracking code: ${trackingCode}\n\nPlease confirm my order.\n\nThank you!`)}`}>
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              </Button>
            )}

            {/* Route order inquiry to platform support via email */}
            <Button
              variant="ghost"
              className="w-full gap-2 text-xs text-muted-foreground"
              asChild
            >
              <a href={`mailto:support@yangu.io?subject=${encodeURIComponent(`Order Support: ${trackingCode}`)}&body=${encodeURIComponent(`Order tracking code: ${trackingCode}\nBusiness: ${businessName || "N/A"}\n\nPlease describe your issue:\n`)}`}>
                📋 Contact Platform Support
              </a>
            </Button>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 mt-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => { onBackToShop ? onBackToShop() : onClose(); }}
            >
              <ShoppingBag className="h-4 w-4" />
              Back to Shop
            </Button>
            <Button
              className="w-full gap-2"
              onClick={() => { onViewMyOrders ? onViewMyOrders() : onClose(); }}
            >
              <ListOrdered className="h-4 w-4" />
              My Orders
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
