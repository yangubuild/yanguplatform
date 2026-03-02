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
        background: "#0B0F14",
      }}
    >
      {/* Inner page sidebar — floating card surface */}
      <div
        className="h-full overflow-hidden flex flex-col"
        style={{
          background: "#0B0F14",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="flex-1 overflow-hidden m-2 mr-0"
          style={{
            background: "#0F141A",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <InnerPageSidebar />
        </div>
      </div>

      {/* Center — Profile workspace — distinct canvas */}
      <div
        className="h-full overflow-hidden"
        style={{
          background: "#0F141A",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <ProfileWorkspace />
      </div>

      {/* Right — Client chat panel — independent surface */}
      <div
        className="h-full overflow-hidden"
        style={{
          background: "#0B0F14",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <ClientChatPanel />
      </div>
    </div>
  );
}
