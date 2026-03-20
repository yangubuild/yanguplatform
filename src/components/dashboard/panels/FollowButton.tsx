import { useIsFollowing, useToggleFollow } from "@/hooks/useFollows";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  targetUserId: string;
  compact?: boolean;
}

export function FollowButton({ targetUserId, compact }: Props) {
  const { user } = useAuth();
  const { data: isFollowing = false } = useIsFollowing(targetUserId);
  const toggleFollow = useToggleFollow();
  const isSelf = user?.id === targetUserId;

  if (isSelf) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFollow.mutate({ targetUserId, isCurrentlyFollowing: isFollowing });
  };

  if (compact) {
    return (
      <span
        onClick={handleClick}
        className="px-3 py-1 rounded-md text-xs font-semibold shrink-0 cursor-pointer transition-colors"
        style={{
          background: isFollowing ? "rgba(255,255,255,0.08)" : "#22c55e",
          color: "#fff",
        }}
      >
        {isFollowing ? "Following" : "Follow"}
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={toggleFollow.isPending}
      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
      style={{
        background: isFollowing ? "rgba(255,255,255,0.08)" : "#22c55e",
        color: "#fff",
      }}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
