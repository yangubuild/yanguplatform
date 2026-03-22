import { useNavigate } from "react-router-dom";
import yanguLogo from "@/assets/yangu-logo-full.png";

export default function BuilderPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-background min-h-screen flex flex-col items-center justify-center" >
      <img src={yanguLogo} alt="yangu" className="h-10 w-auto mb-8 opacity-60" />
      <h1 className="text-2xl font-bold text-foreground mb-3">Builder</h1>
      <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>Full builder page coming soon.</p>
      <button
        onClick={() => navigate(-1)}
        className="px-6 py-3 rounded-xl text-sm font-medium text-foreground transition-opacity hover:opacity-90"
        style={{ background: 'rgba(255,255,255,0.08)' }}>
        Go back
      </button>
    </div>
  );
}
