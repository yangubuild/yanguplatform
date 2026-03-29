import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SocialMediaPosts() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-foreground">Posts</h1>
        <Button variant="accent" size="sm">+ Create Post</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border mb-8">
        {["Drafts (0)", "Scheduled (0)", "Published (0)"].map((tab, i) => (
          <button key={tab} className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${i === 0 ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
          <FileText className="w-10 h-10 text-accent/60" />
        </div>
        <h2 className="text-base font-semibold text-foreground mb-2">No posts yet</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
          Create your first post to get started with your social media strategy.
        </p>
        <Button variant="accent">Create your first post</Button>
      </div>
    </div>
  );
}
