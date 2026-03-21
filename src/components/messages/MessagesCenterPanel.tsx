import type { MessagesTab } from "@/pages/dashboard/MessagesPage";
import { MessagesPostsTab } from "./tabs/MessagesPostsTab";
import { MessagesChatsTab } from "./tabs/MessagesChatsTab";
import { MessagesInfluencersTab } from "./tabs/MessagesInfluencersTab";
import { MessagesSupportTab } from "./tabs/MessagesSupportTab";

const TABS: { key: MessagesTab; label: string }[] = [
  { key: "posts", label: "Posts" },
  { key: "chats", label: "Chats" },
  { key: "influencers", label: "Influencers" },
  { key: "support", label: "Support" },
];

interface Props {
  activeTab: MessagesTab;
  onTabChange: (tab: MessagesTab) => void;
  onSelectDm?: (userId: string) => void;
  onSelectGroup?: (groupId: string) => void;
}

export function MessagesCenterPanel({ activeTab, onTabChange, onSelectDm, onSelectGroup }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div
        className="flex items-center gap-6 px-6 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)", height: 48 }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className="relative text-sm font-medium pb-3 pt-3 transition-colors"
            style={
              activeTab === t.key
                ? { color: "#fff" }
                : { color: "rgba(255,255,255,0.45)" }
            }
          >
            {t.label}
            {activeTab === t.key && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                style={{ background: "#fff" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "posts" && <MessagesPostsTab />}
        {activeTab === "chats" && <MessagesChatsTab onSelectDm={onSelectDm} onSelectGroup={onSelectGroup} />}
        {activeTab === "influencers" && <MessagesInfluencersTab />}
        {activeTab === "support" && <MessagesSupportTab />}
      </div>
    </div>
  );
}
