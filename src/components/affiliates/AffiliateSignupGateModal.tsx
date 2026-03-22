import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import promotionIllustration from "@/assets/affiliate-promo-illustration.png";

interface Props {
  onClose: () => void;
}

export function AffiliateSignupGateModal({ onClose }: Props) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-xl p-10 flex flex-col items-center text-center"
        style={{ background: "#111a15" }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        {/* Illustration */}
        <div className="w-48 h-48 mb-6 flex items-center justify-center">
          <img
            src={promotionIllustration}
            alt=""
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback: hide if image not found
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        <h2 className="text-2xl font-semibold text-foreground mb-3">
          You are not promoting any products yet
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs">
          Browse the marketplace to find products to promote
        </p>

        <button
          onClick={() => {
            onClose();
            navigate("/auth/signup");
          }}
          className="h-10 px-5 rounded-lg text-sm font-medium text-foreground transition-all"
          style={{
            background:
              "linear-gradient(135deg, #c47a3a 0%, #a0522d 50%, #5c2a12 100%)" }}>
          Browse products
        </button>
      </div>
    </div>
  );
}
