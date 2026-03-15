import { AdaContentSections } from "./AdaContentSections";
import { AdaMainPanel } from "./AdaMainPanel";
import { SurfaceProvider } from "@/contexts/SurfaceContext";
import { MassHeader } from "../MassHeader";
import { useNavigate } from "react-router-dom";
import yanguLogoFull from "@/assets/yangu-logo-full.png";

export function LandingAdaPage() {
  const navigate = useNavigate();

  return (
    <SurfaceProvider>
      <div
        className="min-h-screen relative"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(212,149,43,0.10) 0%, rgba(5,10,7,0) 50%), #050A07",
        }}
      >
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-6 pt-8">
          <div className="flex items-center justify-between">
            <img
              src={yanguLogoFull}
              alt="yangu"
              className="h-8 sm:h-12 w-auto cursor-pointer"
              onClick={() => navigate("/")}
            />
            <div className="[&>header]:mb-0">
              <MassHeader hideTrends />
            </div>
          </div>
        </div>

        {/* ADA main panel (public landing — no top controls) */}
        <AdaMainPanel hideBottomSection isLanding />

        {/* Content sections below */}
        <AdaContentSections />
      </div>
    </SurfaceProvider>
  );
}
