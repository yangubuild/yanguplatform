import type { PostStatus } from "@/types/socialMedia";

const STATUS_CONFIG: Record<PostStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  ready: { label: "Ready", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  scheduled: { label: "Scheduled", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  publishing: { label: "Publishing", className: "bg-accent/20 text-accent" },
  published: { label: "Published", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  failed: { label: "Failed", className: "bg-destructive/20 text-destructive" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground" },
};

export function SocialStatusPill({ status }: { status: PostStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
