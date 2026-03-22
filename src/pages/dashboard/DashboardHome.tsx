import { useState, useEffect, useCallback } from "react";
import { InnerPageSidebar, type SidebarItem } from "@/components/dashboard/InnerPageSidebar";
import { useAcceptInvite } from "@/hooks/useAcceptInvite";
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
import { FriendProfileView, type FriendUser } from "@/components/dashboard/FriendProfileView";
import { FriendReviewsRightPanel } from "@/components/dashboard/panels/FriendReviewsRightPanel";
import { FriendPostsRightPanel } from "@/components/dashboard/panels/FriendPostsRightPanel";
import { FriendChatRightPanel } from "@/components/dashboard/panels/FriendChatRightPanel";
import { PostDetailModal } from "@/components/posts/PostDetailModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolveAvatarUrl } from "@/lib/avatarUtils";

export type ProfileTab = "Home" | "KYC" | "Reviews" | "Posts" | "About";

/**
 * Maps sidebar items and profile tabs to right-panel content.
 * When viewing a friend, context-sensitive right panels are shown.
 */
function getRightPanel(
  sidebarItem: SidebarItem,
  profileTab: ProfileTab,
  viewedFriend: FriendUser | null,
  friendTab: string,
  onViewProfile: (user: FriendUser) => void,
) {
  // If viewing a friend and sidebar is "chat", show friend chat
  if (viewedFriend && sidebarItem === "chat") {
    return <FriendChatRightPanel friend={viewedFriend} />;
  }

  // Sidebar-driven panels take priority when not on "home"
  switch (sidebarItem) {
    case "global-chat":
      return <GlobalChatPanel />;
    case "friends":
      return <FriendsPanel onViewProfile={onViewProfile} />;
    case "team":
      return <StaffPanel />;
    case "chat":
      return viewedFriend ? <FriendChatRightPanel friend={viewedFriend} /> : <ChatPanel />;
    case "courses":
      return <CoursesPanel />;
    case "add-app":
      return <AddAppPanel />;
    case "livestreaming":
      return <LivestreamingPanel />;
    default:
      break;
  }

  // When viewing a friend profile, right panel follows friend's active tab
  if (viewedFriend) {
    switch (friendTab) {
      case "Reviews":
        return <FriendReviewsRightPanel friend={viewedFriend} />;
      case "Posts":
        return <FriendPostsRightPanel friend={viewedFriend} />;
      default:
        return <FriendsPanel onViewProfile={onViewProfile} />;
    }
  }

  // When sidebar is "home", right panel follows profile tab
  switch (profileTab) {
    case "Reviews":
      return <ReviewsPanel />;
    case "Posts":
      return <PostsPanel onViewProfile={onViewProfile} />;
    case "About":
      return <AboutPanel />;
    default:
      return <FriendsPanel onViewProfile={onViewProfile} />;
  }
}

/**
 * Dashboard Home — 3-column creator operating hub.
 */
export default function DashboardHome() {
  useAcceptInvite();
  const [activeItem, setActiveItem] = useState<SidebarItem>("home");
  const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>("Home");
  const [viewedFriend, setViewedFriend] = useState<FriendUser | null>(null);
  const [friendTab, setFriendTab] = useState<string>("Home");
  const [postModalId, setPostModalId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle deep-link query params: ?post=ID, ?view_profile=ID
  useEffect(() => {
    const postId = searchParams.get("post");
    const viewProfileId = searchParams.get("view_profile");

    if (postId) {
      setPostModalId(postId);
      // Clean the param so modal doesn't reopen on re-render
      const next = new URLSearchParams(searchParams);
      next.delete("post");
      setSearchParams(next, { replace: true });
    }

    if (viewProfileId) {
      (async () => {
        try {
          const { data: prof } = await supabase
            .from("profiles")
            .select("id, display_name, username, avatar_url, avatar_mode, avatar_emoji_key, business_name, cover_url")
            .eq("id", viewProfileId)
            .single();
          if (prof) {
            const avatar = resolveAvatarUrl(prof);
            handleViewFriend({
              id: prof.id,
              display_name: prof.display_name,
              username: prof.username,
              avatar_url: avatar || prof.avatar_url,
              avatar_mode: prof.avatar_mode,
              avatar_emoji_key: prof.avatar_emoji_key,
              business_name: prof.business_name,
              cover_url: prof.cover_url,
            });
          }
        } catch { /* ignore */ }
      })();
      const next = new URLSearchParams(searchParams);
      next.delete("view_profile");
      setSearchParams(next, { replace: true });
    }
  }, []);

  const handleItemChange = (item: SidebarItem) => {
    setActiveItem(item);
    if (item !== "home") {
      setActiveProfileTab("Home");
    }
  };

  const handleProfileTabChange = (tab: ProfileTab) => {
    setActiveProfileTab(tab);
    if (activeItem !== "home") {
      setActiveItem("home");
    }
  };

  const handleViewFriend = (friend: FriendUser) => {
    setViewedFriend(friend);
    setFriendTab("Home");
    setActiveItem("home");
  };

  const handleBackFromFriend = () => {
    setViewedFriend(null);
    setFriendTab("Home");
  };

  const handleFriendTabChange = (tab: string) => {
    setFriendTab(tab);
  };

  const rightPanel = getRightPanel(activeItem, activeProfileTab, viewedFriend, friendTab, handleViewFriend);

  // Center content: either friend profile or own profile workspace
  const centerContent = viewedFriend ? (
    <FriendProfileView
      user={viewedFriend}
      onBack={handleBackFromFriend}
      onTabChange={handleFriendTabChange}
    />
  ) : (
    <ProfileWorkspace
      activeProfileTab={activeProfileTab}
      onProfileTabChange={handleProfileTabChange}
    />
  );
  const postModal = postModalId ? (
    <PostDetailModal postId={postModalId} onClose={() => setPostModalId(null)} />
  ) : null;

  if (isMobile) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden pb-14 bg-background" >
        {centerContent}
        {postModal}
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
            gap: "0px" }}
        >
          <div className="h-full overflow-hidden p-2 bg-background" >
            <div
              className="h-full overflow-hidden"
              style={{

                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {centerContent}
            </div>
          </div>
          <div className="h-full overflow-hidden p-2 pl-0 bg-background" >
            <div
              className="h-full overflow-hidden"
              style={{

                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {rightPanel}
            </div>
          </div>
        </div>
        {postModal}
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
          gap: "0px" }}
      >
        <div className="h-full overflow-hidden flex flex-col p-2 pr-0 bg-background" >
          <div
            className="flex-1 overflow-hidden"
            style={{

              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <InnerPageSidebar activeItem={activeItem} onItemChange={handleItemChange} />
          </div>
        </div>

        <div className="h-full overflow-hidden p-2 bg-background" >
          <div
            className="h-full overflow-hidden"
            style={{

              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {centerContent}
          </div>
        </div>

        <div className="h-full overflow-hidden p-2 pl-0 bg-background" >
          <div
            className="h-full overflow-hidden"
            style={{

              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {rightPanel}
          </div>
        </div>
      </div>
      {postModal}
    </>
  );
}
