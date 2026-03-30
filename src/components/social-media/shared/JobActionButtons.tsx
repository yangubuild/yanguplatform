/**
 * YANGU — Job Action Buttons
 * Retry / Cancel / Reschedule controls for publish jobs.
 */

import { Button } from "@/components/ui/button";
import { RefreshCw, XCircle, Clock } from "lucide-react";
import type { PostJobStatus } from "@/hooks/social/usePostJobs";

interface JobActionButtonsProps {
  jobId: string;
  status: PostJobStatus;
  onRetry: (jobId: string) => Promise<void>;
  onCancel: (jobId: string) => Promise<void>;
  onReschedule?: (jobId: string) => void;
  isRetrying?: boolean;
  isCancelling?: boolean;
}

export function JobActionButtons({
  jobId,
  status,
  onRetry,
  onCancel,
  onReschedule,
  isRetrying,
  isCancelling,
}: JobActionButtonsProps) {
  const canRetry = status === "failed";
  const canCancel = status === "queued" || status === "retrying";
  const canReschedule = status === "queued" || status === "retrying" || status === "failed";

  if (!canRetry && !canCancel && !canReschedule) return null;

  return (
    <div className="flex items-center gap-1.5">
      {canRetry && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={isRetrying}
          onClick={() => onRetry(jobId)}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
      {canCancel && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
          disabled={isCancelling}
          onClick={() => onCancel(jobId)}
        >
          <XCircle className="h-3 w-3 mr-1" />
          Cancel
        </Button>
      )}
      {canReschedule && onReschedule && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onReschedule(jobId)}
        >
          <Clock className="h-3 w-3 mr-1" />
          Reschedule
        </Button>
      )}
    </div>
  );
}
