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
import { CoursesPanel } from "@/components/dashboard/panels/CoursesPanel";
import { ChatPanel } from "@/components/dashboard/panels/ChatPanel";
import { AddAppPanel } from "@/components/dashboard/panels/AddAppPanel";
import { LivestreamingPanel } from "@/components/dashboard/panels/LivestreamingPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useNavigate } from "react-router-dom";

export type ProfileTab = "Home" | "KYC" | "Reviews" | "Posts" | "About";

/**
 * Maps sidebar items and profile tabs to right-panel content.
 */
function getRightPanel(sidebarItem: SidebarItem, profileTab: ProfileTab) {
  // Sidebar-driven panels take priority when not on "home"
  switch (sidebarItem) {
    case "global-chat":
      return <GlobalChatPanel />;
    case "friends":
      return <FriendsPanel />;
    case "team":
      return <StaffPanel />;
    case "chat":
      return <ChatPanel />;
    case "courses":
      return <CoursesPanel />;
    case "add-app":
      return <AddAppPanel />;
    case "livestreaming":
      return <LivestreamingPanel />;
    default:
      break;
  }

  // When sidebar is "home", right panel follows profile tab
  switch (profileTab) {
    case "Reviews":
      return <ReviewsPanel />;
    case "Posts":
      return <PostsPanel />;
    case "About":
      return <AboutPanel />;
    default:
      return <FriendsPanel />;
  }
}

/**
 * Dashboard Home — 3-column creator operating hub.
 */
export default function DashboardHome() {
  const [activeItem, setActiveItem] = useState<SidebarItem>("home");
  const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>("Home");
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const navigate = useNavigate();

  const handleItemChange = (item: SidebarItem) => {
    // Add App now opens in right panel instead of navigating away
    setActiveItem(item);
    // Reset profile tab to Home when switching sidebar items
    if (item !== "home") {
      setActiveProfileTab("Home");
    }
  };

  const handleProfileTabChange = (tab: ProfileTab) => {
    setActiveProfileTab(tab);
    // Ensure sidebar shows "home" when user clicks profile tabs
    if (activeItem !== "home") {
      setActiveItem("home");
    }
  };

  const rightPanel = getRightPanel(activeItem, activeProfileTab);

  if (isMobile) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
        <ProfileWorkspace
          activeProfileTab={activeProfileTab}
          onProfileTabChange={handleProfileTabChange}
        />
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
          <div className="h-full overflow-hidden p-2" style={{ background: "#0B0F14" }}>
            <div
              className="h-full overflow-hidden"
              style={{
                background: "#0F141A",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <ProfileWorkspace
                activeProfileTab={activeProfileTab}
                onProfileTabChange={handleProfileTabChange}
              />
            </div>
          </div>
          <div className="h-full overflow-hidden p-2 pl-0" style={{ background: "#0B0F14" }}>
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
        <div className="h-full overflow-hidden flex flex-col p-2 pr-0" style={{ background: "#0B0F14" }}>
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

        <div className="h-full overflow-hidden p-2" style={{ background: "#0B0F14" }}>
          <div
            className="h-full overflow-hidden"
            style={{
              background: "#0F141A",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <ProfileWorkspace
              activeProfileTab={activeProfileTab}
              onProfileTabChange={handleProfileTabChange}
            />
          </div>
        </div>

        <div className="h-full overflow-hidden p-2 pl-0" style={{ background: "#0B0F14" }}>
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
    </>
  );
}
