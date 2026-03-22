import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  companyName: string;
  avatarUrl: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function AffiliateJoinModal({ companyName, avatarUrl, onConfirm, onClose }: Props) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl p-8" style={{ background: "#111a15" }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-xl overflow-hidden mb-5">
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-6">
          Become an affiliate with {companyName}
        </h2>

        <label className="flex items-start gap-3 mb-6 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-white/20 bg-transparent accent-accent"
          />
          <span className="text-sm text-muted-foreground">
            I accept the{" "}
            <span className="text-blue-400 hover:underline cursor-pointer">Terms of Use</span>
            {" "}and{" "}
            <span className="text-blue-400 hover:underline cursor-pointer">Privacy Policy</span>
          </span>
        </label>

        <button
          onClick={() => { if (accepted) { onConfirm(); onClose(); } }}
          disabled={!accepted}
          className="w-full h-10 rounded-lg text-sm font-medium transition-all"
          style={{
            background: accepted
              ? "linear-gradient(135deg, #c47a3a 0%, #a0522d 50%, #5c2a12 100%)"
              : "rgba(255,255,255,0.06)",
            color: accepted ? "#fff" : "rgba(255,255,255,0.3)",
            cursor: accepted ? "pointer" : "not-allowed" }}
        >
          Become affiliate
        </button>
      </div>
    </div>
  );
}
