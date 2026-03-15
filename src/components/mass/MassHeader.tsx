import { useNavigate } from "react-router-dom";
import yanguLogo from "@/assets/yangu-logo-full.png";

import { MassTrendsBar } from "./MassTrendsBar";

export function MassHeader({ hideTrends, showLogo }: { hideTrends?: boolean; showLogo?: boolean } = {}) {
  const navigate = useNavigate();

  return (
    <header className="mb-8 lg:overflow-visible">
      {/* Top row - Logo left, buttons right when needed */}
      <div className={`flex items-center ${showLogo ? "justify-between" : "justify-end"} gap-4`}>
        {showLogo && (
          <button
            type="button"
            onClick={() => navigate("/")}
            className="shrink-0"
            aria-label="Go to home page"
          >
            <img src={yanguLogo} alt="yangu" className="h-12 w-auto" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <button
            className="rounded-lg border px-5 py-[8px] text-[14px] font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: "#152A20", borderColor: "#152A20", color: "#FFFFFF" }}
            onClick={() => navigate("/auth/login")}
          >
            Sign in
          </button>
          <button
            className="rounded-lg px-5 py-[8px] text-[14px] font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #c47a3a 0%, #b5622a 50%, #5c2a12 100%)" }}
            onClick={() => navigate("/auth/signup")}
          >
            Start selling
          </button>
        </div>
      </div>

      {/* Trends bar - directly below buttons */}
      {!hideTrends && <MassTrendsBar />}
    </header>
  );
}
