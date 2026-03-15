import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MessagesDmList } from "@/components/messages/MessagesDmList";
import { MessagesCenterPanel } from "@/components/messages/MessagesCenterPanel";
import { MessagesDiscoverySidebar } from "@/components/messages/MessagesDiscoverySidebar";
import { InfluencerProfilePopup } from "@/components/messages/InfluencerProfilePopup";
import { useIsMobile } from "@/hooks/use-mobile";
import { Users, X } from "lucide-react";

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
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (tabParam && ["posts", "chats", "influencers", "global"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: MessagesTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Mobile: single-column stacked layout
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden" style={{ background: "#0B0F14" }}>
        {/* Users drawer toggle */}
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

        {/* Users drawer overlay */}
        {showUsersPanel && (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0F141A" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-sm font-semibold text-white">People</span>
              <button onClick={() => setShowUsersPanel(false)} style={{ color: "rgba(255,255,255,0.5)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MessagesDiscoverySidebar users={POPULAR_USERS} onUserClick={(u) => { setSelectedUser(u); setShowUsersPanel(false); }} />
            </div>
          </div>
        )}

        {/* Center panel — full width */}
        <div className="flex-1 min-h-0 overflow-hidden"
          style={{
            background: "#0F141A",
            borderRadius: "14px",
            margin: "0 8px 8px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <MessagesCenterPanel activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {selectedUser && (
          <InfluencerProfilePopup user={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
      </div>
    );
  }

  return (
    <div
      className="h-[calc(100vh-64px)] overflow-hidden"
      style={{
        display: "grid",
        gridTemplateColumns: "300px 1fr 340px",
        gap: "0px",
        background: "#0B0F14",
      }}
    >
      {/* LEFT — DM List — floating card surface */}
      <div
        className="h-full overflow-hidden p-2 pr-0"
        style={{ background: "#0B0F14" }}
      >
        <div
          className="h-full overflow-hidden flex flex-col"
          style={{
            background: "#0F141A",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <MessagesDmList selectedId={selectedDm} onSelect={setSelectedDm} />
        </div>
      </div>

      {/* CENTER — Tabs + content — distinct canvas */}
      <div
        className="h-full overflow-hidden p-2"
        style={{ background: "#0B0F14" }}
      >
        <div
          className="h-full overflow-hidden flex flex-col"
          style={{
            background: "#0F141A",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <MessagesCenterPanel activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      </div>

      {/* RIGHT — Discovery sidebar — independent surface */}
      <div
        className="h-full overflow-hidden p-2 pl-0"
        style={{ background: "#0B0F14" }}
      >
        <div
          className="h-full overflow-hidden flex flex-col overflow-y-auto"
          style={{
            background: "#0F141A",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <MessagesDiscoverySidebar
            users={POPULAR_USERS}
            onUserClick={setSelectedUser}
          />
        </div>
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
