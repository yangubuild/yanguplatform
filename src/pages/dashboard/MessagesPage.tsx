import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MessagesDmList } from "@/components/messages/MessagesDmList";
import { MessagesCenterPanel } from "@/components/messages/MessagesCenterPanel";
import { MessagesDiscoverySidebar } from "@/components/messages/MessagesDiscoverySidebar";
import { InfluencerProfilePopup } from "@/components/messages/InfluencerProfilePopup";

export type MessagesTab = "posts" | "chats" | "influencers" | "global";

export interface PopularUser {
  id: string;
  name: string;
  descriptor: string;
  avatarUrl?: string;
  online?: boolean;
  onlineColor?: string;
}

const POPULAR_USERS: PopularUser[] = [
  { id: "1", name: "Punkchainer", descriptor: "Creator of PunkChainer's + 1 more", online: true, onlineColor: "green" },
  { id: "2", name: "Steven S", descriptor: "Creator of Steven's whop + 34 more", online: true, onlineColor: "green" },
  { id: "3", name: "Vera", descriptor: "Creator of Vera Witty FX + 2 more", online: true, onlineColor: "green" },
  { id: "4", name: "Melih", descriptor: "Creator of Ecomz Türkiye" },
  { id: "5", name: "Alex", descriptor: "Creator of Virality + 8 more", online: true, onlineColor: "green" },
  { id: "6", name: "zack0x01", descriptor: "Creator of zack0X01 BugBounty cour…" },
  { id: "7", name: "Nathan Johnson", descriptor: "Creator of David Ghiyam Clipping Hu…", online: true, onlineColor: "green" },
  { id: "8", name: "ddurz", descriptor: "Creator of DDURZCLIPS", online: true, onlineColor: "green" },
  { id: "9", name: "Kéo", descriptor: "Creator of 6 Figure OFM + 1 more", online: true, onlineColor: "yellow" },
  { id: "10", name: "Felix Prehn", descriptor: "Creator of Felix & Friends + 2 more", online: true, onlineColor: "yellow" },
];

export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as MessagesTab | null;
  const [activeTab, setActiveTab] = useState<MessagesTab>(tabParam && ["posts", "chats", "influencers", "global"].includes(tabParam) ? tabParam : "posts");
  const [selectedDm, setSelectedDm] = useState<string | null>("team-yangu");
  const [selectedUser, setSelectedUser] = useState<PopularUser | null>(null);

  useEffect(() => {
    if (tabParam && ["posts", "chats", "influencers", "global"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: MessagesTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* LEFT — DM List */}
      <div
        className="w-[300px] min-w-[300px] flex flex-col border-r"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <MessagesDmList selectedId={selectedDm} onSelect={setSelectedDm} />
      </div>

      {/* CENTER — Tabs + content */}
      <div className="flex-1 flex flex-col min-w-0">
        <MessagesCenterPanel activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* RIGHT — Discovery sidebar */}
      <div
        className="w-[340px] min-w-[340px] flex flex-col border-l overflow-y-auto"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <MessagesDiscoverySidebar
          users={POPULAR_USERS}
          onUserClick={setSelectedUser}
        />
      </div>

      {/* Influencer popup overlay */}
      {selectedUser && (
        <InfluencerProfilePopup
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
