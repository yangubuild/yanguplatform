import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import AvatarPickerModal from "@/components/profile/AvatarPickerModal";
import {
  MoreHorizontal,
  MapPin,
  Calendar,
  Users,
  ExternalLink,
  Link2,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

const mockCreated = [
  {
    id: "1",
    initials: "F&",
    title: "Fresh & Wholesome Foods Co.",
    category: "Food And Beverages",
    members: 1,
    earnings: "$0",
    age: "13d",
  },
  {
    id: "2",
    initials: "UO",
    title: "Urban Oasis Salon & Spa",
    category: "Salon Spa",
    members: 0,
    earnings: "$0",
    age: "2mo",
  },
];

const mockJoined = [
  {
    id: "3",
    initials: "YG",
    title: "yangu Creators Hub",
    category: "Community",
    members: 24,
    earnings: "$0",
    age: "1mo",
  },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"created" | "joined" | "reviews">("created");
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const avatarSrc = profile ? resolveAvatarUrl(profile) : null;
  const coverUrl = (profile as any)?.cover_url || null;
  const displayName = profile?.display_name || "User";
  const username = profile?.username || "user";
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Dec 2025";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://yangu.io/@${username}`);
    toast({ title: "Link copied to clipboard" });
  };

  const tabData = activeTab === "created" ? mockCreated : activeTab === "joined" ? mockJoined : [];

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Banner */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          height: 160,
          background: coverUrl
            ? `url(${coverUrl}) center/cover no-repeat`
            : "#2a3038",
        }}
      >
        {/* Three-dot menu */}
        <div className="absolute top-3 right-3 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)" }}
              >
                <MoreHorizontal className="w-5 h-5 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => toast({ title: "Share dialog coming soon" })}>
                <ExternalLink className="w-4 h-4 mr-2" /> Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Link2 className="w-4 h-4 mr-2" /> Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard/profile/edit")}>
                <Pencil className="w-4 h-4 mr-2" /> Edit profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Avatar */}
      <div className="-mt-12 ml-4 mb-2">
        <button
          onClick={() => setAvatarModalOpen(true)}
          className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden group relative"
          style={avatarSrc
            ? { background: "transparent" }
            : { borderWidth: 4, borderStyle: "solid", borderColor: "#1a2025", background: "#2a3038", color: "rgba(255,255,255,0.6)" }
          }
          title="Change avatar"
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" className="w-24 h-24 rounded-full object-cover" style={{ clipPath: "circle(50%)" }} />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
            <Pencil className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>

      <AvatarPickerModal open={avatarModalOpen} onOpenChange={setAvatarModalOpen} />

      {/* Name / username */}
      <div className="px-1">
        <h1 className="text-xl font-bold text-white">{displayName}</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>@{username}</p>

        {/* Location + joined */}
        <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Dubai, AE</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined {joinDate}</span>
        </div>

        {/* Followers */}
        <div className="flex items-center gap-4 mt-3">
          <span className="text-sm text-white"><strong>0</strong> <span style={{ color: "rgba(255,255,255,0.5)" }}>Followers</span></span>
          <span className="text-sm text-white"><strong>0</strong> <span style={{ color: "rgba(255,255,255,0.5)" }}>Following</span></span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => navigate("/dashboard/profile/edit")}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)", background: "transparent" }}
          >
            Edit profile
          </button>
          <button
            onClick={() => navigate("/dashboard/profile/subscription")}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)", background: "transparent" }}
          >
            Manage subscriptions
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="flex">
          {(["created", "joined", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-3 text-sm font-medium text-center capitalize transition-colors relative"
              style={{ color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.45)" }}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" style={{ background: "#b5622a" }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-4 space-y-1">
        {tabData.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Nothing here yet.
          </p>
        ) : (
          tabData.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-4 rounded-xl transition-colors cursor-pointer"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: "#2a3038", color: "rgba(255,255,255,0.6)" }}
              >
                {item.initials}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{item.category}</p>
                <p className="text-xs flex items-center gap-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                  <Users className="w-3 h-3" /> {item.members}
                </p>
              </div>
              {/* Earnings */}
              <div className="text-right shrink-0">
                <p className="text-base font-bold text-white">{item.earnings}</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>all-time · {item.age}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
