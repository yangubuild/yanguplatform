import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import yanguLogo from "@/assets/yangu-logo-full.png";

interface Props {
  onMenuClick: () => void;
}

export function LandingTestHeader({ onMenuClick }: Props) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between py-5 mb-4">
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-2 text-white/60 hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <img src={yanguLogo} alt="yangu" className="h-8 w-auto cursor-pointer" onClick={() => navigate("/landingtest")} />
      </div>

      {/* Right: nav + CTAs */}
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-6">
          <button onClick={() => navigate("/builder")} className="text-sm text-white/60 hover:text-white transition-colors">Builder</button>
          <button onClick={() => navigate("/developers")} className="text-sm text-white/60 hover:text-white transition-colors">Developers</button>
        </nav>
        <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
}
