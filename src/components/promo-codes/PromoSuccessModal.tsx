import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Download, Eye, CheckCircle, QrCode, Link as LinkIcon } from "lucide-react";
import type { CreatedPromo } from "@/pages/dashboard/PromoCodesPage";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  promo: CreatedPromo;
}

function generateQRDataUrl(text: string, size = 200): string {
  // Simple QR-like SVG placeholder using a data URL
  // In production, use a QR library. For now, create a styled placeholder.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#111a15"/>
    <rect x="20" y="20" width="60" height="60" rx="4" fill="#fff"/>
    <rect x="26" y="26" width="48" height="48" rx="2" fill="#111a15"/>
    <rect x="32" y="32" width="36" height="36" rx="2" fill="#fff"/>
    <rect x="${size-80}" y="20" width="60" height="60" rx="4" fill="#fff"/>
    <rect x="${size-74}" y="26" width="48" height="48" rx="2" fill="#111a15"/>
    <rect x="${size-68}" y="32" width="36" height="36" rx="2" fill="#fff"/>
    <rect x="20" y="${size-80}" width="60" height="60" rx="4" fill="#fff"/>
    <rect x="26" y="${size-74}" width="48" height="48" rx="2" fill="#111a15"/>
    <rect x="32" y="${size-68}" width="36" height="36" rx="2" fill="#fff"/>
    <text x="${size/2}" y="${size/2+5}" text-anchor="middle" font-size="12" fill="#fff" font-family="monospace">${text.substring(0, 12)}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function PromoSuccessModal({ open, onClose, promo }: Props) {
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (promo) {
      setQrUrl(generateQRDataUrl(promo.promoLink));
    }
  }, [promo]);

  const copyLink = () => {
    navigator.clipboard.writeText(promo.promoLink);
    toast.success("Link copied!");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(promo.code);
    toast.success("Code copied!");
  };

  const downloadQR = () => {
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `promo-${promo.code}-qr.svg`;
    a.click();
    toast.success("QR code downloaded!");
  };

  if (!open) return null;

  const discount = `${promo.discountValue}${promo.discountType === "percentage" ? "%" : "$"} OFF`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: "#111a15" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h2 className="text-base font-semibold text-white">Promo code created!</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06]">
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Code display */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center">
            <p className="text-xs text-white/40 mb-1">Promo Code</p>
            <p className="text-xl font-bold text-white tracking-wider">{promo.code}</p>
            <p className="text-sm text-accent mt-1">{discount}</p>
          </div>

          {/* QR Code */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 flex flex-col items-center gap-3">
            <p className="text-xs text-white/40">QR Code</p>
            <img src={qrUrl} alt="QR Code" className="w-32 h-32 rounded-lg" />
          </div>

          {/* Promo Link */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs text-white/40 mb-2">Promo Link</p>
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-white/30 shrink-0" />
              <span className="text-sm text-white/70 truncate flex-1">{promo.promoLink}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={copyCode}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] p-3 transition-colors"
            >
              <Copy className="w-4 h-4 text-white/60" />
              <span className="text-[11px] text-white/50">Copy Code</span>
            </button>
            <button
              onClick={copyLink}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] p-3 transition-colors"
            >
              <LinkIcon className="w-4 h-4 text-white/60" />
              <span className="text-[11px] text-white/50">Copy Link</span>
            </button>
            <button
              onClick={downloadQR}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] p-3 transition-colors"
            >
              <Download className="w-4 h-4 text-white/60" />
              <span className="text-[11px] text-white/50">Download QR</span>
            </button>
          </div>

          {/* Popup preview hint */}
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 flex items-center gap-3">
            <Eye className="w-5 h-5 text-accent shrink-0" />
            <div>
              <p className="text-xs font-medium text-white/80">Popup ad generated</p>
              <p className="text-[11px] text-white/40">
                A promo popup will appear on your published business page for visitors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
