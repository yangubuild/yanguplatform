import { AdaContentSections } from "./AdaContentSections";
import { AdaMainPanel } from "./AdaMainPanel";
import { SurfaceProvider } from "@/contexts/SurfaceContext";
import { SecondaryPageHeaderShell } from "../SecondaryPageHeaderShell";

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
          <SecondaryPageHeaderShell />

          {/* ADA main panel (public landing — no top controls) */}
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-10">
            <AdaMainPanel hideBottomSection isLanding />
          </div>

          {/* Content sections below */}
          <AdaContentSections />
        </main>
      </div>
    </SurfaceProvider>
  );
}
