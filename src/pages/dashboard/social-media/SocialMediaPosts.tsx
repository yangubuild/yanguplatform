import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, MoreHorizontal, Trash2, Copy, Archive, Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocialPosts } from "@/hooks/social/useSocialPosts";
import { toast } from "sonner";
import { format } from "date-fns";
import type { PostStatus, SocialPost } from "@/types/socialMedia";

const TABS: { key: PostStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
  { key: "failed", label: "Failed" },
  { key: "archived", label: "Archived" },
];

export default function SocialMediaPosts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<PostStatus | "all">("all");
  const statusFilter = activeTab === "all" ? undefined : activeTab;
  const { posts, counts, isLoading, deletePost, archivePost, duplicatePost, publishPost } = useSocialPosts(statusFilter);
  const [showCreate, setShowCreate] = useState(searchParams.get("create") === "true");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const tabCounts: Record<string, number> = {
    all: counts.drafts + counts.scheduled + counts.published + counts.failed,
    draft: counts.drafts,
    scheduled: counts.scheduled,
    published: counts.published,
    failed: counts.failed,
    archived: counts.archived,
  };

  const handleAction = async (action: string, post: SocialPost) => {
    setMenuOpen(null);
    try {
      switch (action) {
        case "delete":
          await deletePost(post.id);
          toast.success("Post deleted");
          break;
        case "archive":
          await archivePost(post.id);
          toast.success("Post archived");
          break;
        case "duplicate":
          await duplicatePost(post.id);
          toast.success("Post duplicated");
          break;
        case "publish":
          await publishPost(post.id);
          toast.success("Post published");
          break;
        case "retry":
          await publishPost(post.id);
          toast.success("Retrying publish…");
          break;
      }
    } catch {
      toast.error(`Failed to ${action} post`);
    }
  };

  const statusColor: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    ready: "bg-blue-500/10 text-blue-600",
    scheduled: "bg-amber-500/10 text-amber-600",
    publishing: "bg-accent/10 text-accent",
    published: "bg-green-500/10 text-green-600",
    failed: "bg-destructive/10 text-destructive",
    archived: "bg-muted text-muted-foreground",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-foreground">Posts</h1>
        <Button variant="accent" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Create Post
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label} ({tabCounts[tab.key] ?? 0})
          </button>
        ))}
      </div>

      {/* Posts list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-sm text-muted-foreground">Loading posts…</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
            <FileText className="w-10 h-10 text-accent/60" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-2">No posts yet</h2>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
            Create your first post to get started with your social media strategy.
          </p>
          <Button variant="accent" onClick={() => setShowCreate(true)}>Create your first post</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="rounded-xl border border-border bg-card p-4 hover:border-accent/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-2 mb-2">
                    {post.caption || <span className="text-muted-foreground italic">No caption</span>}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${statusColor[post.status] || "bg-muted text-muted-foreground"}`}>
                      {post.status}
                    </span>
                    {post.scheduled_for && (
                      <span className="text-xs text-muted-foreground">
                        Scheduled: {format(new Date(post.scheduled_for), "MMM d, h:mm a")}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(post.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {menuOpen === post.id && (
                    <div className="absolute right-0 top-8 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                      {post.status === "draft" && (
                        <MenuBtn icon={Send} label="Publish Now" onClick={() => handleAction("publish", post)} />
                      )}
                      {post.status === "failed" && (
                        <MenuBtn icon={RotateCcw} label="Retry" onClick={() => handleAction("retry", post)} />
                      )}
                      <MenuBtn icon={Copy} label="Duplicate" onClick={() => handleAction("duplicate", post)} />
                      {post.status !== "archived" && (
                        <MenuBtn icon={Archive} label="Archive" onClick={() => handleAction("archive", post)} />
                      )}
                      <MenuBtn icon={Trash2} label="Delete" onClick={() => handleAction("delete", post)} destructive />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreatePostDialog open={showCreate} onClose={() => { setShowCreate(false); setSearchParams({}); }} />
    </div>
  );
}

function MenuBtn({ icon: Icon, label, onClick, destructive }: { icon: any; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-muted transition-colors ${
        destructive ? "text-destructive" : "text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
