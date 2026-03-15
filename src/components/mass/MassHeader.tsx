import { useNavigate } from "react-router-dom";

import { MassTrendsBar } from "./MassTrendsBar";

export function MassHeader({ hideTrends }: { hideTrends?: boolean } = {}) {
  const navigate = useNavigate();

  return (
    <header className="mb-8 lg:overflow-visible">
      {/* Top row - Buttons aligned right */}
      <div className="flex items-center justify-end gap-3">
        <button
          className="rounded-[14px] border px-5 py-[8px] text-[14px] font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: "#152A20", borderColor: "#152A20", color: "#FFFFFF" }}
          onClick={() => navigate("/auth/login")}
        >
          Sign in
        </button>
        <button
          className="rounded-[14px] px-5 py-[8px] text-[14px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #c47a3a 0%, #b5622a 50%, #5c2a12 100%)" }}
          onClick={() => navigate("/auth/signup")}
        >
          Start selling
        </button>
      </div>

      {/* Trends bar - directly below buttons */}
      {!hideTrends && <MassTrendsBar />}
    </header>
  );
}
