import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, XCircle } from "lucide-react";
import type { FailedJob } from "@/hooks/social/useOperationalAnalytics";

interface Props {
  data: FailedJob[];
  onRetry?: (jobId: string) => void;
  onCancel?: (jobId: string) => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  instagram_story: "IG Story",
  x: "X",
  linkedin_company: "LinkedIn Co.",
  linkedin_personal: "LinkedIn",
  tiktok: "TikTok",
};

export function FailedJobsTable({ data, onRetry, onCancel }: Props) {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4">
        <p className="text-sm font-semibold text-foreground mb-3">
          Failed / Retrying Jobs
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Platform</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Reason</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Attempts</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Next Retry</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                <th className="text-right py-2 pl-3 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-border/50">
                  <td className="py-2.5 pr-3 text-foreground">
                    {PLATFORM_LABELS[row.platform] || row.platform}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground max-w-[200px] truncate">
                    {row.last_error || "Unknown error"}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {row.attempts}/{row.max_attempts}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                    {row.next_retry_at
                      ? new Date(row.next_retry_at).toLocaleTimeString()
                      : "—"}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex text-[10px] font-semibold ${
                        row.status === "retrying"
                          ? "text-amber-500"
                          : "text-red-400"
                      }`}
                    >
                      {row.status === "retrying" ? "Retrying" : "Failed"}
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {row.status === "failed" && onRetry && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onRetry(row.id)}
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      )}
                      {onCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground"
                          onClick={() => onCancel(row.id)}
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
