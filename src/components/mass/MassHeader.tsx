import { useNavigate } from "react-router-dom";

import { MassTrendsBar } from "./MassTrendsBar";

export function MassHeader({ hideTrends }: { hideTrends?: boolean } = {}) {
  const navigate = useNavigate();

  return (
    <header className="mb-8 lg:overflow-visible">
      {/* Top row - Buttons aligned right */}
      <div className="flex items-center justify-end gap-3">
        <button
          className="px-5 py-2.5 text-base md:text-lg font-semibold transition-colors hover:opacity-90"
          style={{ backgroundColor: "#152A20", border: "1px solid #152A20", borderRadius: 12, color: "#FFFFFF" }}
          onClick={() => navigate("/auth/login")}
        >
          Sign in
        </button>
        <button
          className="px-5 py-2.5 text-base md:text-lg font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)", borderRadius: 12 }}
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