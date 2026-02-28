import { InnerPageSidebar } from "@/components/dashboard/InnerPageSidebar";
import { ProfileWorkspace } from "@/components/dashboard/ProfileWorkspace";
import { ClientChatPanel } from "@/components/dashboard/ClientChatPanel";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Dashboard Home — 3-column creator operating hub.
 * Uses CSS grid with hard partitions between columns.
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
        gridTemplateColumns: "280px 1fr 360px",
        background: "rgba(255,255,255,0.06)",
        gap: "1px",
      }}
    >
      {/* Inner page sidebar */}
      <div className="h-full overflow-y-auto" style={{ background: "#1a2025" }}>
        <InnerPageSidebar />
      </div>

      {/* Center — Profile workspace — scalable */}
      <div className="h-full overflow-y-auto" style={{ background: "#0f171c" }}>
        <ProfileWorkspace />
      </div>

      {/* Right — Client chat panel */}
      <div className="h-full overflow-y-auto" style={{ background: "#1a2025" }}>
        <ClientChatPanel />
      </div>
    </div>
  );
}
