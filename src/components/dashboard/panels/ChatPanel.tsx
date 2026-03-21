import { useState } from "react";
import { MessagesChatsTab } from "@/components/messages/tabs/MessagesChatsTab";
import { CreateGroupModal } from "@/components/messages/CreateGroupModal";
import { GroupChatThreadView } from "@/components/messages/GroupChatThreadView";
import { useMyGroups } from "@/hooks/useGroupChats";
import { Plus } from "lucide-react";

export function ChatPanel() {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const { data: groups = [] } = useMyGroups();
  const activeGroup = groups.find(g => g.id === activeGroupId) || null;

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-white">Chat</span>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="p-1 rounded hover:opacity-80"
          style={{ color: "rgba(255,255,255,0.4)" }}
          title="Create Group"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeGroupId && activeGroup ? (
          <GroupChatThreadView group={activeGroup} onBack={() => setActiveGroupId(null)} />
        ) : (
          <MessagesChatsTab onSelectGroup={setActiveGroupId} />
        )}
      </div>
      <CreateGroupModal open={showCreateGroup} onClose={() => setShowCreateGroup(false)} onCreated={setActiveGroupId} />
    </div>
  );
}
