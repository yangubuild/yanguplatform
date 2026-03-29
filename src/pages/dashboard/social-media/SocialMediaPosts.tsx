import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  List,
  SlidersHorizontal,
  Filter,
  Bookmark,
  Clock,
  CheckSquare,
  MoreHorizontal,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocialPosts } from "@/hooks/social/useSocialPosts";
import { toast } from "sonner";
import type { SocialPost, PostStatus } from "@/types/socialMedia";
import { CreateWithAIMenu } from "@/components/social-media/posts/CreateWithAIMenu";
import { PostCard } from "@/components/social-media/posts/PostCard";
import { ScheduledTab } from "@/components/social-media/posts/ScheduledTab";
import { EditPostModal } from "@/components/social-media/posts/EditPostModal";
import { PostDetailsModal } from "@/components/social-media/posts/PostDetailsModal";

type TabKey = "draft" | "scheduled" | "published";

const TABS: { key: TabKey; label: string; icon: typeof Bookmark }[] = [
  { key: "draft", label: "Drafts", icon: Bookmark },
  { key: "scheduled", label: "Scheduled", icon: Clock },
  { key: "published", label: "Published", icon: CheckSquare },
];

export default function SocialMediaPosts() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("draft");
  const { posts, counts, isLoading, deletePost, duplicatePost, publishPost, archivePost } =
    useSocialPosts(activeTab === "draft" ? "draft" : activeTab === "scheduled" ? "scheduled" : "published");

  const [editPost, setEditPost] = useState<SocialPost | null>(null);
  const [detailPost, setDetailPost] = useState<SocialPost | null>(null);

  const tabCounts: Record<TabKey, number> = {
    draft: counts.drafts,
    scheduled: counts.scheduled,
    published: counts.published,
  };

  const handleAction = useCallback(
    async (action: string, post: SocialPost) => {
      try {
        switch (action) {
          case "delete":
            await deletePost(post.id);
            toast.success("Post deleted");
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
          case "archive":
            await archivePost(post.id);
            toast.success("Post archived");
            break;
          case "schedule":
            setEditPost(post);
            break;
          case "schedule_next":
            toast.info("Schedule Next — coming soon");
            break;
          case "lock_time":
            toast.info("Lock Time — coming soon");
            break;
          case "ingredients":
            toast.info("Post ingredients — coming soon");
            break;
          case "download":
            if (post.primary_media_url || post.media_urls?.[0]) {
              window.open(post.primary_media_url || post.media_urls[0], "_blank");
            }
            break;
          case "share":
            toast.info("Share link — coming soon");
            break;
        }
      } catch {
        toast.error(`Failed to ${action} post`);
      }
    },
    [deletePost, duplicatePost, publishPost, archivePost]
  );

  const handleAICreate = (mode: string) => {
    navigate(`/dashboard/social-media/posts/create?mode=${mode}`);
  };

  return (
    <div className="w-full px-4 sm:px-6 py-6 overflow-x-hidden">
      {/* ── Top toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-1.5">
          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
            <List className="h-3.5 w-3.5" />
          </button>
          <button className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
          <button className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
            <Filter className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 bg-muted/30 rounded-lg p-0.5 overflow-x-auto shrink-0">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? "bg-card text-accent shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label} ({tabCounts[tab.key]})
              </button>
            );
          })}
        </div>

        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* ── Create buttons ── */}
      {activeTab === "draft" && (
        <div className="flex items-center justify-center gap-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => navigate("/dashboard/social-media/posts/create")}
          >
            Create from Scratch
          </Button>
          <CreateWithAIMenu onSelect={handleAICreate} />
        </div>
      )}

      {/* ── Tab content — centered narrow feed column ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-sm text-muted-foreground">Loading posts…</div>
        </div>
      ) : activeTab === "scheduled" ? (
        <div className="max-w-[480px] mx-auto">
          <ScheduledTab
            posts={posts}
            onAction={handleAction}
            onEdit={setEditPost}
            onDetails={setDetailPost}
          />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-xl bg-muted/30 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {activeTab === "draft" ? "No posts in Drafts" : "No published posts"}
          </h3>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            {activeTab === "draft"
              ? "Create posts manually or let AI generate them from your topics and profile."
              : "Published posts and their analytics will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-w-[480px] mx-auto">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              onAction={handleAction}
              onEdit={setEditPost}
              onDetails={setDetailPost}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {editPost && (
        <EditPostModal
          post={editPost}
          open={!!editPost}
          onClose={() => setEditPost(null)}
        />
      )}
      {detailPost && (
        <PostDetailsModal
          post={detailPost}
          open={!!detailPost}
          onClose={() => setDetailPost(null)}
          onDelete={(p) => {
            handleAction("delete", p);
            setDetailPost(null);
          }}
        />
      )}
    </div>
  );
}
