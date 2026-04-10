/**
 * OrderSuccessDialog — Shown after successful order placement.
 * Provides tracking code, contact actions (WhatsApp, Email, Phone).
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageCircle, Mail, Phone, Copy } from "lucide-react";
import { toast } from "sonner";

interface OrderSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  trackingCode: string;
  supportPhone?: string | null;
  supportEmail?: string | null;
  supportWhatsapp?: string | null;
  businessName?: string;
}

export function OrderSuccessDialog({
  open, onClose, trackingCode, supportPhone, supportEmail, supportWhatsapp, businessName,
}: OrderSuccessDialogProps) {
  const copyCode = () => {
    navigator.clipboard.writeText(trackingCode);
    toast.success("Tracking code copied!");
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
                <a href={`mailto:${supportEmail}?subject=Order ${trackingCode}`}>
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              </Button>
            )}
          </div>

          <Button onClick={onClose} className="w-full mt-2">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
