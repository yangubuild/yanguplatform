import { useNavigate } from "react-router-dom";
import { MassTrendsBar } from "./MassTrendsBar";

export function MassHeader({ hideTrends }: { hideTrends?: boolean } = {}) {
  const navigate = useNavigate();

  return (
    <header className="mb-8 lg:overflow-visible">
      {/* Top row - Buttons aligned right */}
      <div className="flex items-center justify-end gap-3">
        <button 
          onClick={() => navigate("/auth/login")}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{
            background: '#152A20',
          }}
        >
          Sign in
        </button>
        <button 
          onClick={() => navigate("/auth/signup")}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{
            background: 'linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)',
          }}
        >
          Start selling
        </button>
      </div>

      {/* Trends bar - directly below buttons */}
      {!hideTrends && <MassTrendsBar />}
    </header>
  );
}
