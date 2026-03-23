import { X } from "lucide-react";

interface PopularUser {
  id: string;
  name: string;
  descriptor: string;
  avatarUrl?: string;
  online?: boolean;
  onlineColor?: string;
}

interface Props {
  user: PopularUser;
  onClose: () => void;
}

export function InfluencerProfilePopup({ user, onClose }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />

      {/* Card */}
      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] rounded-2xl p-6 shadow-2xl"
        style={{ background: "#1a2027", border: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-muted-foreground">
          <X className="w-4 h-4" />
        </button>

        {/* Avatar + Info */}
        <div className="flex flex-col items-center text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold mb-3"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <h3 className="text-base font-semibold text-foreground">{user.name}</h3>
          <p className="text-xs mt-0.5 text-muted-foreground">
            @{user.name.toLowerCase().replace(/\s+/g, "")}
          </p>
          <p className="text-xs mt-1 text-muted-foreground">
            {user.descriptor}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mt-5">
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">—</p>
            <p className="text-[11px] text-muted-foreground">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">—</p>
            <p className="text-[11px] text-muted-foreground">Following</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-5">
          <button
            className="flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "rgba(96,165,250,1)" }}>
            Follow
          </button>
          <button
            className="flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            Message
          </button>
        </div>
      </div>
    </>
  );
}
