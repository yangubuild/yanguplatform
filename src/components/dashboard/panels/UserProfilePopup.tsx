import { X, MessageSquare, ExternalLink, MapPin, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { useIsFollowing, useFollowCounts, useToggleFollow } from "@/hooks/useFollows";
import { useAuth } from "@/hooks/useAuth";

interface UserData {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  avatar_mode?: string | null;
  avatar_emoji_key?: string | null;
  business_name: string | null;
  cover_url?: string | null;
}

interface Props {
  user: UserData;
  onClose: () => void;
  onViewProfile?: () => void;
  onMessage?: (userId: string) => void;
}

export function UserProfilePopup({ user, onClose, onViewProfile, onMessage }: Props) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const name = user.display_name || user.username || "Unnamed";
  const initials = name.slice(0, 2).toUpperCase();
  const resolvedAvatar = resolveAvatarUrl(user);

  const { data: isFollowing = false } = useIsFollowing(user.id);
  const { data: counts } = useFollowCounts(user.id);
  const toggleFollow = useToggleFollow();
  const isSelf = currentUser?.id === user.id;

  const handleMessage = () => {
    if (onMessage) {
      onMessage(user.id);
    } else {
      navigate(`/dashboard/messages?tab=chats&user=${user.id}`);
    }
    onClose();
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile();
    } else {
      navigate(`/dashboard/home?view_profile=${user.id}`);
      onClose();
    }
  };

  const handleFollow = () => {
    if (isSelf) return;
    if (!currentUser) {
      navigate("/auth/login");
      return;
    }
    toggleFollow.mutate({ targetUserId: user.id, isCurrentlyFollowing: isFollowing });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />

      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#111a15", border: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 z-10 text-muted-foreground">
          <X className="w-4 h-4" />
        </button>

        {/* Mini cover image */}
        <div
          className="w-full h-[100px]"
          style={{
            background: user.cover_url
              ? `url(${user.cover_url}) center/cover no-repeat`
              : "linear-gradient(135deg, #0d3a27 0%, #061a12 100%)" }}
        />

        {/* Avatar overlapping cover */}
        <div className="flex flex-col items-center text-center -mt-10 relative z-10 px-5 pb-5">
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-lg font-bold overflow-hidden"
            style={{
              background: resolvedAvatar ? "transparent" : "rgba(255,255,255,0.1)", border: "3px solid #111a15" }}>
            {resolvedAvatar ? (
              <img src={resolvedAvatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <h3 className="text-base font-semibold text-foreground mt-2">{name}</h3>
          {user.username && (
            <p className="text-xs mt-0.5 text-muted-foreground">
              @{user.username}
            </p>
          )}
          {user.business_name && (
            <p className="text-xs mt-1 text-muted-foreground">
              {user.business_name}
            </p>
          )}

          {/* Mini metadata row */}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" /> Location
            </span>
            <span className="flex items-center gap-0.5">
              <Users className="w-2.5 h-2.5" /> {counts?.followers ?? 0} followers
            </span>
          </div>

          {/* Message input bar */}
          <div
            className="w-full mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <input
              type="text"
              placeholder="Send message"
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleMessage();
              }}
            />
            <button
              onClick={handleMessage}
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3 w-full">
            <button
              onClick={handleMessage}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "rgba(181,98,42,0.9)" }}>
              <MessageSquare className="w-3.5 h-3.5" /> Message
            </button>
            {!isSelf && (
              <button
                onClick={handleFollow}
                disabled={toggleFollow.isPending}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background: isFollowing ? "rgba(255,255,255,0.08)" : "#22c55e" }}>
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>

          <button
            onClick={handleViewProfile}
            className="w-full flex items-center justify-center gap-1.5 py-2 mt-2 rounded-lg text-sm font-medium"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <ExternalLink className="w-3.5 h-3.5" /> View Profile
          </button>
        </div>
      </div>
    </>
  );
}
