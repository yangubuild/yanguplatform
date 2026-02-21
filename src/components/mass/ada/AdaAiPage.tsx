import { AdaMainPanel } from "./AdaMainPanel";
import { SurfaceProvider } from "@/contexts/SurfaceContext";

export function AdaAiPage() {
  return (
    <SurfaceProvider>
      <div
        className="h-full flex flex-col overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(212,149,43,0.10) 0%, rgba(5,10,7,0) 50%), #050A07" }}
      >
        <AdaMainPanel />
      </div>
    </SurfaceProvider>
  );
}
