import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MassTrendsBar } from "./MassTrendsBar";

export function MassHeader({ hideTrends }: { hideTrends?: boolean } = {}) {
  const navigate = useNavigate();

  return (
    <header className="mb-8 lg:overflow-visible">
      {/* Top row - Buttons aligned right */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="success"
          size="sm"
          onClick={() => navigate("/auth/login")}
        >
          Sign in
        </Button>
        <Button
          variant="accent"
          size="sm"
          onClick={() => navigate("/auth/signup")}
        >
          Start selling
        </Button>
      </div>

      {/* Trends bar - directly below buttons */}
      {!hideTrends && <MassTrendsBar />}
    </header>
  );
}
