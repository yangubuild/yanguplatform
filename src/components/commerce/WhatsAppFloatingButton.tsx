/**
 * WhatsAppFloatingButton — Floating WhatsApp chat icon on public pages.
 * Shown when owner has enabled WhatsApp contact.
 */

import { MessageCircle } from "lucide-react";

interface WhatsAppFloatingButtonProps {
  phoneNumber: string;
  defaultMessage?: string;
}

export function WhatsAppFloatingButton({ phoneNumber, defaultMessage }: WhatsAppFloatingButtonProps) {
  const handleClick = () => {
    const phone = phoneNumber.replace(/[^0-9+]/g, "");
    const msg = defaultMessage ? encodeURIComponent(defaultMessage) : "";
    window.open(`https://wa.me/${phone}${msg ? `?text=${msg}` : ""}`, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}
