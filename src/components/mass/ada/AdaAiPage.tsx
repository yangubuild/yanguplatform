import { AdaMainPanel } from "./AdaMainPanel";
import { SurfaceProvider } from "@/contexts/SurfaceContext";
import { useNavigate } from "react-router-dom";
import yanguLogoFull from "@/assets/yangu-logo-full.png";

export function AdaAiPage() {
  const navigate = useNavigate();

  return (
    <SurfaceProvider>
      <div
        className="h-full flex flex-col overflow-hidden relative"
        style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(212,149,43,0.10) 0%, rgba(5,10,7,0) 50%), #050A07" }}
      >
        <img
          src={yanguLogoFull}
          alt="yangu"
          className="absolute top-5 left-7 h-12 w-auto cursor-pointer z-10"
          onClick={() => navigate("/")}
        />
        <AdaMainPanel />
      </div>
    </SurfaceProvider>
  );
}
