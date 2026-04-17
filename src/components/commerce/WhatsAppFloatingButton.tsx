/**
 * WhatsAppFloatingButton — Floating WhatsApp chat icon on public pages.
 * Shown when owner has enabled WhatsApp contact.
 */

import whatsappIcon from "@/assets/whatsapp-icon.png";

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
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 bg-transparent p-0"
      aria-label="Chat on WhatsApp"
    >
      <img src={whatsappIcon} alt="WhatsApp" className="w-full h-full object-contain" />
    </button>
  );
}
