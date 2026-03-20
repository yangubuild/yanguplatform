import { useState } from "react";
import { InnerPageSidebar, type SidebarItem } from "@/components/dashboard/InnerPageSidebar";
import { ProfileWorkspace } from "@/components/dashboard/ProfileWorkspace";
import { ClientChatPanel } from "@/components/dashboard/ClientChatPanel";
import { DashboardCreditPromo } from "@/components/dashboard/DashboardCreditPromo";
import { FriendsPanel } from "@/components/dashboard/panels/FriendsPanel";
import { StaffPanel } from "@/components/dashboard/panels/StaffPanel";
import { ReviewsPanel } from "@/components/dashboard/panels/ReviewsPanel";
import { PostsPanel } from "@/components/dashboard/panels/PostsPanel";
import { AboutPanel } from "@/components/dashboard/panels/AboutPanel";
import { GlobalChatPanel } from "@/components/dashboard/panels/GlobalChatPanel";
import { ChatPanel } from "@/components/dashboard/panels/ChatPanel";
import { VerifiedModal } from "@/components/dashboard/panels/VerifiedModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useNavigate } from "react-router-dom";

/**
 * Maps sidebar items to right-panel content.
 * Some items (home, add-app, livestreaming, courses) don't change the right panel.
 */
function getRightPanel(active: SidebarItem) {
  switch (active) {
    case "global-chat":
      return <GlobalChatPanel />;
    case "friends":
      return <FriendsPanel />;
    case "staff":
      return <StaffPanel />;
    case "chat":
      return <ChatPanel />;
    case "reviews":
      return <ReviewsPanel />;
    case "posts":
      return <PostsPanel />;
    case "about":
      return <AboutPanel />;
    default:
      return <ClientChatPanel />;
  }
}

/**
 * Dashboard Home — 3-column creator operating hub.
 * Mobile: single-column ProfileWorkspace
 * Tablet (md): 2-column — ProfileWorkspace + RightPanel
 * Desktop (lg+): 3-column — InnerPageSidebar + ProfileWorkspace + RightPanel
 */
export default function DashboardHome() {
  const [activeItem, setActiveItem] = useState<SidebarItem>("home");
  const [verifiedOpen, setVerifiedOpen] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const navigate = useNavigate();

  const handleItemChange = (item: SidebarItem) => {
    // Special cases that navigate or open modals instead of switching panels
    if (item === "add-app") {
      navigate("/dashboard/apps");
      return;
    }
    if (item === "verified") {
      setVerifiedOpen(true);
      return;
    }
    if (item === "livestreaming") {
      // Keep selected state, no panel change yet
      setActiveItem(item);
      return;
    }
    if (item === "courses") {
      setActiveItem(item);
      return;
    }
    setActiveItem(item);
  };

  const rightPanel = getRightPanel(activeItem);

  if (isMobile) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
        <ProfileWorkspace />
        <VerifiedModal open={verifiedOpen} onOpenChange={setVerifiedOpen} />
      </div>
    );
  }

  if (isTablet) {
    return (
      <>
        <DashboardCreditPromo />
        <div
          className="h-[calc(100vh-64px)] overflow-hidden"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "0px",
            background: "#0B0F14",
          }}
        >
          {/* Center — Profile workspace */}
          <div
            className="h-full overflow-hidden p-2"
            style={{ background: "#0B0F14" }}
          >
            <div
              className="h-full overflow-hidden"
              style={{
                background: "#0F141A",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <ProfileWorkspace />
            </div>
          </div>

          {/* Right panel */}
          <div
            className="h-full overflow-hidden p-2 pl-0"
            style={{ background: "#0B0F14" }}
          >
            <div
              className="h-full overflow-hidden"
              style={{
                background: "#0F141A",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {rightPanel}
            </div>
          </div>
        </div>
        <VerifiedModal open={verifiedOpen} onOpenChange={setVerifiedOpen} />
      </>
    );
  }

  return (
    <>
      <DashboardCreditPromo />
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
          className="h-full overflow-hidden flex flex-col p-2 pr-0"
          style={{ background: "#0B0F14" }}
        >
          <div
            className="flex-1 overflow-hidden"
            style={{
              background: "#0F141A",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <InnerPageSidebar activeItem={activeItem} onItemChange={handleItemChange} />
          </div>
        </div>

        {/* Center — Profile workspace — distinct canvas */}
        <div
          className="h-full overflow-hidden p-2"
          style={{ background: "#0B0F14" }}
        >
          <div
            className="h-full overflow-hidden"
            style={{
              background: "#0F141A",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <ProfileWorkspace />
          </div>
        </div>

        {/* Right panel — content switches based on sidebar selection */}
        <div
          className="h-full overflow-hidden p-2 pl-0"
          style={{ background: "#0B0F14" }}
        >
          <div
            className="h-full overflow-hidden"
            style={{
              background: "#0F141A",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {rightPanel}
          </div>
        </div>
      </div>
      <VerifiedModal open={verifiedOpen} onOpenChange={setVerifiedOpen} />
    </>
  );
}
