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
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      {/* Inner page sidebar */}
      <div className="w-[240px] shrink-0">
        <InnerPageSidebar />
      </div>

      {/* Center — Profile workspace */}
      <div
        className="flex-1 min-w-0"
        style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}
      >
        <ProfileWorkspace />
      </div>

      {/* Right — Client chat */}
      <div className="w-[340px] shrink-0">
        <ClientChatPanel />
      </div>
    </div>
  );
}
