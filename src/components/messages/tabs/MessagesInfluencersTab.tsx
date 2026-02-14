import { Users } from "lucide-react";

export function MessagesInfluencersTab() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <Users className="h-8 w-8" style={{ color: "rgba(255,255,255,0.3)" }} />
      </div>
      <p className="text-sm font-medium text-white">Discover Influencers</p>
      <p className="text-xs max-w-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
        Find and connect with top creators and influencers in the community.
      </p>
    </div>
  );
}
