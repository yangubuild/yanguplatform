import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MessagesDmList } from "@/components/messages/MessagesDmList";
import { MessagesCenterPanel } from "@/components/messages/MessagesCenterPanel";
import { MessagesDiscoverySidebar } from "@/components/messages/MessagesDiscoverySidebar";
import { DmThreadView } from "@/components/messages/DmThreadView";
import { GroupChatThreadView } from "@/components/messages/GroupChatThreadView";
import { CreateGroupModal } from "@/components/messages/CreateGroupModal";
import { useMyGroups, type ChatGroup } from "@/hooks/useGroupChats";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Users, X } from "lucide-react";

export type MessagesTab = "posts" | "chats" | "influencers" | "support";

export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as MessagesTab | null;
  const userParam = searchParams.get("user");
  const groupParam = searchParams.get("group");

  const [activeTab, setActiveTab] = useState<MessagesTab>(
    tabParam && ["posts", "chats", "influencers", "support"].includes(tabParam) ? tabParam : "posts"
  );
  const [activeConversationUserId, setActiveConversationUserId] = useState<string | null>(userParam || null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(groupParam || null);
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

  const { data: groups = [] } = useMyGroups();
  const activeGroup = groups.find(g => g.id === activeGroupId) || null;

  useEffect(() => {
    if (userParam) {
      setActiveTab("chats");
      setActiveConversationUserId(userParam);
      setActiveGroupId(null);
    }
    if (groupParam) {
      setActiveTab("chats");
      setActiveGroupId(groupParam);
      setActiveConversationUserId(null);
    }
  }, [userParam, groupParam]);

  useEffect(() => {
    if (tabParam && ["posts", "chats", "influencers", "support"].includes(tabParam)) {
      setActiveTab(tabParam as MessagesTab);
    }
  }, [tabParam]);

  const handleTabChange = (tab: MessagesTab) => {
    setActiveTab(tab);
    if (tab !== "chats") {
      setActiveConversationUserId(null);
      setActiveGroupId(null);
    }
    setSearchParams({ tab });
  };

  const handleSelectConversation = (userId: string) => {
    setActiveConversationUserId(userId);
    setActiveGroupId(null);
    setActiveTab("chats");
    setSearchParams({ tab: "chats", user: userId });
  };

  const handleSelectGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    setActiveConversationUserId(null);
    setActiveTab("chats");
    setSearchParams({ tab: "chats", group: groupId });
  };

  const handleGroupCreated = (groupId: string) => {
    handleSelectGroup(groupId);
  };

  const centerContent =
    activeTab === "chats" && activeGroupId && activeGroup ? (
      <GroupChatThreadView
        group={activeGroup}
        onBack={() => { setActiveGroupId(null); setSearchParams({ tab: "chats" }); }}
      />
    ) : activeTab === "chats" && activeConversationUserId ? (
      <DmThreadView targetUserId={activeConversationUserId} />
    ) : (
      <MessagesCenterPanel activeTab={activeTab} onTabChange={handleTabChange} />
    );

  if (isMobile) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden" style={{ background: "#0B0F14" }}>
        <div className="flex items-center justify-end px-3 py-2">
          <button
            onClick={() => setShowUsersPanel(!showUsersPanel)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
          >
            <Users className="w-3.5 h-3.5" />
            People
          </button>
        </div>

        {showUsersPanel && (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0F141A" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-sm font-semibold text-white">People</span>
              <button onClick={() => setShowUsersPanel(false)} style={{ color: "rgba(255,255,255,0.5)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MessagesDiscoverySidebar onUserClick={(userId) => { handleSelectConversation(userId); setShowUsersPanel(false); }} />
            </div>
          </div>
        )}

        <div
          className="flex-1 min-h-0 overflow-hidden"
          style={{
            background: "#0F141A",
            borderRadius: "14px",
            margin: "0 8px 8px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {centerContent}
        </div>

        <CreateGroupModal open={showCreateGroup} onClose={() => setShowCreateGroup(false)} onCreated={handleGroupCreated} />
      </div>
    );
  }

  if (isTablet) {
    return (
      <div
        className="h-[calc(100vh-64px)] overflow-hidden"
        style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "0px", background: "#0B0F14" }}
      >
        <div className="h-full overflow-hidden p-2 pr-0" style={{ background: "#0B0F14" }}>
          <div className="h-full overflow-hidden flex flex-col" style={{ background: "#0F141A", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <MessagesDmList
              selectedUserId={activeConversationUserId}
              selectedGroupId={activeGroupId}
              onSelectUser={handleSelectConversation}
              onSelectGroup={handleSelectGroup}
              onCreateGroup={() => setShowCreateGroup(true)}
            />
          </div>
        </div>
        <div className="h-full overflow-hidden p-2" style={{ background: "#0B0F14" }}>
          <div className="h-full overflow-hidden flex flex-col" style={{ background: "#0F141A", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
            {centerContent}
          </div>
        </div>

        <CreateGroupModal open={showCreateGroup} onClose={() => setShowCreateGroup(false)} onCreated={handleGroupCreated} />
      </div>
    );
  }

  return (
    <div
      className="h-[calc(100vh-64px)] overflow-hidden"
      style={{ display: "grid", gridTemplateColumns: "300px 1fr 340px", gap: "0px", background: "#0B0F14" }}
    >
      <div className="h-full overflow-hidden p-2 pr-0" style={{ background: "#0B0F14" }}>
        <div className="h-full overflow-hidden flex flex-col" style={{ background: "#0F141A", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <MessagesDmList
            selectedUserId={activeConversationUserId}
            selectedGroupId={activeGroupId}
            onSelectUser={handleSelectConversation}
            onSelectGroup={handleSelectGroup}
            onCreateGroup={() => setShowCreateGroup(true)}
          />
        </div>
      </div>

      <div className="h-full overflow-hidden p-2" style={{ background: "#0B0F14" }}>
        <div className="h-full overflow-hidden flex flex-col" style={{ background: "#0F141A", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
          {centerContent}
        </div>
      </div>

      <div className="h-full overflow-hidden p-2 pl-0" style={{ background: "#0B0F14" }}>
        <div className="h-full overflow-hidden flex flex-col overflow-y-auto" style={{ background: "#0F141A", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <MessagesDiscoverySidebar onUserClick={handleSelectConversation} />
        </div>
      </div>

      <CreateGroupModal open={showCreateGroup} onClose={() => setShowCreateGroup(false)} onCreated={handleGroupCreated} />
    </div>
  );
}
