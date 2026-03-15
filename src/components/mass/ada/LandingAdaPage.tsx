import { AdaContentSections } from "./AdaContentSections";
import { AdaMainPanel } from "./AdaMainPanel";
import { SurfaceProvider } from "@/contexts/SurfaceContext";
import { MassHeader } from "../MassHeader";

export function LandingAdaPage() {
  return (
    <SurfaceProvider>
      <div
        className="min-h-screen relative"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(212,149,43,0.10) 0%, rgba(5,10,7,0) 50%), #050A07",
        }}
      >
        <main className="min-h-screen">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-6 pt-8">
            <MassHeader hideTrends showLogo />
          </div>

          {/* ADA main panel (public landing — no top controls) */}
          <AdaMainPanel hideBottomSection isLanding />

          {/* Content sections below */}
          <AdaContentSections />
        </main>
      </div>
    </SurfaceProvider>
  );
}