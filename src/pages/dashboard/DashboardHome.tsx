import { InnerPageSidebar } from "@/components/dashboard/InnerPageSidebar";
import { ProfileWorkspace } from "@/components/dashboard/ProfileWorkspace";
import { ClientChatPanel } from "@/components/dashboard/ClientChatPanel";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Dashboard Home — 3-column creator operating hub.
 * Pixel-matched to the target screenshot.
 */
export default function DashboardHome() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
        <ProfileWorkspace />
      </div>
    );
  }

  return (
    <div
      className="h-[calc(100vh-64px)] overflow-hidden"
      style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr 340px",
        gap: "0px",
      }}
    >
      {/* Inner page sidebar */}
      <div
        className="h-full overflow-hidden"
        style={{
          background: "#141a1f",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <InnerPageSidebar />
      </div>

      {/* Center — Profile workspace — only this scrolls */}
      <div
        className="h-full overflow-hidden"
        style={{
          background: "#0f141a",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <ProfileWorkspace />
      </div>

      {/* Right — Client chat panel */}
      <div
        className="h-full overflow-hidden"
        style={{ background: "#111820" }}
      >
        <ClientChatPanel />
      </div>
    </div>
  );
}
