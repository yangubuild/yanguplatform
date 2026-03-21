import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { MessagesDmList } from "@/components/messages/MessagesDmList";
import { MessagesCenterPanel } from "@/components/messages/MessagesCenterPanel";
import { MessagesDiscoverySidebar } from "@/components/messages/MessagesDiscoverySidebar";
import { DmThreadView } from "@/components/messages/DmThreadView";
import { GroupChatThreadView } from "@/components/messages/GroupChatThreadView";
import { ChatCreationLauncher } from "@/components/messages/ChatCreationLauncher";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, X, Plus, Loader2 } from "lucide-react";

export type MessagesTab = "chats" | "influencers" | "support";

export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as MessagesTab | null;
  const userParam = searchParams.get("user");
  const groupParam = searchParams.get("group");

  const [activeTab, setActiveTab] = useState<MessagesTab>(
    tabParam && ["chats", "influencers", "support"].includes(tabParam) ? tabParam as MessagesTab : "chats"
  );
  const [activeConversationUserId, setActiveConversationUserId] = useState<string | null>(userParam || null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(groupParam || null);
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  const [showCreateLauncher, setShowCreateLauncher] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

  const { data: activeGroup, isLoading: loadingActiveGroup } = useQuery({
    queryKey: ["active-group-thread", activeGroupId],
    enabled: activeTab === "chats" && !!activeGroupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_groups")
        .select("*")
        .eq("id", activeGroupId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (userParam) {
      setActiveTab("chats");
      setActiveConversationUserId(userParam);
      setActiveGroupId(null);
    }
  }, [userParam]);

  useEffect(() => {
    if (groupParam) {
      setActiveTab("chats");
      setActiveGroupId(groupParam);
      setActiveConversationUserId(null);
    }
  }, [groupParam]);

  useEffect(() => {
    if (tabParam && ["chats", "influencers", "support"].includes(tabParam)) {
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

  const handleCloseThread = () => {
    setActiveConversationUserId(null);
    setActiveGroupId(null);
    setSearchParams({ tab: "chats" });
  };

  const centerContent =
    activeTab === "chats" && activeGroupId ? (
      loadingActiveGroup ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
        </div>
      ) : activeGroup ? (
        <GroupChatThreadView group={activeGroup as any} onBack={handleCloseThread} />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center px-6">
          <p className="text-sm font-medium text-white">Group not available</p>
          <p className="text-xs text-white/40">This group could not be loaded or you no longer have access.</p>
        </div>
      )
    ) : activeTab === "chats" && activeConversationUserId ? (
      <DmThreadView targetUserId={activeConversationUserId} />
    ) : (
      <MessagesCenterPanel activeTab={activeTab} onTabChange={handleTabChange} onSelectDm={handleSelectConversation} />
    );

  if (isMobile) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden" style={{ background: "#0B0F14" }}>
        <div className="flex items-center justify-end px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUsersPanel(!showUsersPanel)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
            >
              <Users className="w-3.5 h-3.5" />
              People
            </button>
            <button
              onClick={() => setShowCreateLauncher(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)" }}
              aria-label="Create chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
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

        <ChatCreationLauncher
          open={showCreateLauncher}
          onOpenChange={setShowCreateLauncher}
          onSelectUser={handleSelectConversation}
          onOpenGroup={handleSelectGroup}
        />
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
              onSelectUser={handleSelectConversation}
              onOpenCreateMenu={() => setShowCreateLauncher(true)}
            />
          </div>
        </div>
        <div className="h-full overflow-hidden p-2" style={{ background: "#0B0F14" }}>
          <div className="h-full overflow-hidden flex flex-col" style={{ background: "#0F141A", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
            {centerContent}
          </div>
        </div>

        <ChatCreationLauncher
          open={showCreateLauncher}
          onOpenChange={setShowCreateLauncher}
          onSelectUser={handleSelectConversation}
          onOpenGroup={handleSelectGroup}
        />
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
            onSelectUser={handleSelectConversation}
            onOpenCreateMenu={() => setShowCreateLauncher(true)}
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

      <ChatCreationLauncher
        open={showCreateLauncher}
        onOpenChange={setShowCreateLauncher}
        onSelectUser={handleSelectConversation}
        onOpenGroup={handleSelectGroup}
      />
    </div>
  );
}
