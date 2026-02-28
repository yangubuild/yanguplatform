import { InnerPageSidebar } from "@/components/dashboard/InnerPageSidebar";
import { ProfileWorkspace } from "@/components/dashboard/ProfileWorkspace";
import { ClientChatPanel } from "@/components/dashboard/ClientChatPanel";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Dashboard Home — 3-column creator operating hub.
 * Inner sidebar | Profile workspace | Client chat
 */
export default function DashboardHome() {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Mobile: just profile workspace, full width
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
        <ProfileWorkspace />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex gap-[1px] overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      {/* Inner page sidebar — narrowest */}
      <div className="w-[220px] shrink-0" style={{ background: "#1a2025" }}>
        <InnerPageSidebar />
      </div>

      {/* Center — Profile workspace — widest */}
      <div className="flex-1 min-w-0" style={{ background: "#0f171c" }}>
        <ProfileWorkspace />
      </div>

      {/* Right — Client chat — medium */}
      <div className="w-[320px] shrink-0" style={{ background: "#1a2025" }}>
        <ClientChatPanel />
      </div>
    </div>
  );
}
