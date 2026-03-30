import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { AccountHealth } from "@/hooks/social/useOperationalAnalytics";

interface Props {
  data: AccountHealth[];
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

export function AccountHealthTable({ data }: Props) {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4">
        <p className="text-sm font-semibold text-foreground mb-3">
          Connected Account Health
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Platform</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Account</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left py-2 pl-3 text-muted-foreground font-medium">Health</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-border/50">
                  <td className="py-2.5 pr-3 text-foreground">
                    {PLATFORM_LABELS[row.platform] || row.platform}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {row.display_name || "—"}
                  </td>
                  <td className="py-2.5 px-3">
                    {row.status === "active" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    ) : row.needs_reconnect ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500">
                        <AlertTriangle className="w-3 h-3" />
                        Reconnect Needed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400">
                        <XCircle className="w-3 h-3" />
                        Error
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pl-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        row.status === "active"
                          ? "bg-emerald-500"
                          : row.needs_reconnect
                          ? "bg-amber-500"
                          : "bg-red-400"
                      }`}
                    />
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
