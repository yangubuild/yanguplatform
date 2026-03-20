import { X, MessageSquare, UserPlus, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserData {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  business_name: string | null;
}

interface Props {
  user: UserData;
  onClose: () => void;
}

export function UserProfilePopup({ user, onClose }: Props) {
  const navigate = useNavigate();
  const name = user.display_name || user.username || "Unnamed";
  const initials = name.slice(0, 2).toUpperCase();

  const handleMessage = () => {
    // Navigate to messages page — connects to real messaging system
    navigate(`/dashboard/messages?tab=chats`);
    onClose();
  };

  const handleViewProfile = () => {
    navigate(`/user/${user.username || user.id}`);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />

      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] rounded-2xl p-5 shadow-2xl"
        style={{ background: "#232a30", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold mb-3 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <h3 className="text-base font-semibold text-white">{name}</h3>
          {user.username && (
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              @{user.username}
            </p>
          )}
          {user.business_name && (
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              {user.business_name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={handleMessage}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "rgba(96,165,250,1)", color: "#fff" }}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Message
          </button>
          <button
            className="flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "#22c55e", color: "#fff" }}
          >
            Follow
          </button>
        </div>

        <button
          onClick={handleViewProfile}
          className="w-full flex items-center justify-center gap-1.5 py-2 mt-2 rounded-lg text-sm font-medium"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
        >
          <ExternalLink className="w-3.5 h-3.5" /> View Profile
        </button>
      </div>
    </>
  );
}
