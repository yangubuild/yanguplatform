import { useState } from "react";
import {
  CalendarIcon,
  Lock,
  MoreVertical,
  Shuffle,
  SkipForward,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostCard } from "./PostCard";
import type { SocialPost } from "@/types/socialMedia";

type SubTab = "queue" | "lock_times";

interface Props {
  posts: SocialPost[];
  onAction: (action: string, post: SocialPost) => void;
  onEdit?: (post: SocialPost) => void;
  onDetails?: (post: SocialPost) => void;
}

export function ScheduledTab({ posts, onAction, onEdit, onDetails }: Props) {
  const [subTab, setSubTab] = useState<SubTab>("queue");

  return (
    <div>
      {/* Sub-tabs + overflow */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <button
          onClick={() => setSubTab("queue")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-medium transition-colors ${
            subTab === "queue"
              ? "border-accent text-accent bg-accent/5"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarIcon className="h-3.5 w-3.5" /> Queue ({posts.length})
        </button>
        <button
          onClick={() => setSubTab("lock_times")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-medium transition-colors ${
            subTab === "lock_times"
              ? "border-accent text-accent bg-accent/5"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lock className="h-3.5 w-3.5" /> Lock Times (0)
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-2 text-xs">
              <Shuffle className="h-3.5 w-3.5" /> Shuffle Queue
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-xs">
              <SkipForward className="h-3.5 w-3.5" /> Add Skip Time
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-xs">
              <Settings className="h-3.5 w-3.5" /> Manage Schedule
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      {subTab === "queue" ? (
        posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-xl bg-muted/30 flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">No posts in queue</h3>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Schedule posts to automatically publish them at optimal times based on your{" "}
              <span className="text-accent">posting schedule</span>.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} onAction={onAction} onEdit={onEdit} onDetails={onDetails} />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <Lock className="w-8 h-8 text-muted-foreground/50 mb-4" />
          <h3 className="text-sm font-semibold text-foreground mb-1">No lock times set</h3>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Lock times let you pin posts to specific dates and times in your schedule.
          </p>
        </div>
      )}
    </div>
  );
}
