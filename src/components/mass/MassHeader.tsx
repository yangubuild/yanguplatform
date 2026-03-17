import { useNavigate } from "react-router-dom";
import yanguLogo from "@/assets/yangu-logo-full.png";
import { Button } from "@/components/ui/button";

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
          <Button
            variant="solid"
            size="default"
            onClick={() => navigate("/auth/login")}
          >
            Sign in
          </Button>
          <Button
            variant="accent"
            size="default"
            onClick={() => navigate("/auth/signup")}
          >
            Start selling
          </Button>
        </div>
      </div>

      {/* Trends bar - directly below buttons */}
      {!hideTrends && <MassTrendsBar />}
    </header>
  );
}
