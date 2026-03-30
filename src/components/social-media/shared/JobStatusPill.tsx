/**
 * YANGU — Job Status Pill
 * Displays publish job status with color coding.
 */

import type { PostJobStatus } from "@/hooks/social/usePostJobs";

const JOB_STATUS_CONFIG: Record<PostJobStatus, { label: string; className: string }> = {
  queued: {
    label: "Queued",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  processing: {
    label: "Publishing…",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse",
  },
  published: {
    label: "Published",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  retrying: {
    label: "Retrying",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  failed: {
    label: "Failed",
    className: "bg-destructive/20 text-destructive",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground",
  },
};

export function JobStatusPill({ status }: { status: PostJobStatus }) {
  const config = JOB_STATUS_CONFIG[status] || JOB_STATUS_CONFIG.queued;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
