/**
 * YANGU — Job Failure Reason Display
 * Shows readable failure reason + reconnect hint for expired tokens.
 */

import { AlertTriangle, RefreshCw, Link2Off } from "lucide-react";

interface JobFailureReasonProps {
  error: string | null;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: string | null;
}

const ERROR_LABELS: Record<string, string> = {
  auth_expired: "Token expired — reconnect your account",
  rate_limited: "Platform rate limit hit",
  invalid_media: "Media file rejected by platform",
  unsupported_format: "Unsupported media format",
  platform_rejection: "Rejected by platform policy",
  network_timeout: "Network timeout",
  provider_outage: "Platform temporarily unavailable",
  unknown: "Unexpected error",
};

function categorizeFromError(error: string): string {
  const lower = error.toLowerCase();
  if (lower.includes("token") || lower.includes("unauthorized") || lower.includes("401") || lower.includes("auth"))
    return "auth_expired";
  if (lower.includes("rate") || lower.includes("429")) return "rate_limited";
  if (lower.includes("media") || lower.includes("image") || lower.includes("video")) return "invalid_media";
  if (lower.includes("format") || lower.includes("unsupported")) return "unsupported_format";
  if (lower.includes("rejected") || lower.includes("policy")) return "platform_rejection";
  if (lower.includes("timeout")) return "network_timeout";
  if (lower.includes("503") || lower.includes("502") || lower.includes("unavailable")) return "provider_outage";
  return "unknown";
}

export function JobFailureReason({ error, attempts, maxAttempts, nextRetryAt }: JobFailureReasonProps) {
  if (!error) return null;

  const category = categorizeFromError(error);
  const label = ERROR_LABELS[category] || error;
  const isAuthIssue = category === "auth_expired";

  return (
    <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-md p-2">
      {isAuthIssue ? (
        <Link2Off className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground mt-0.5">
          Attempt {attempts}/{maxAttempts}
          {nextRetryAt && (
            <>
              {" · "}
              <RefreshCw className="inline h-3 w-3" /> Retry at{" "}
              {new Date(nextRetryAt).toLocaleTimeString()}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
