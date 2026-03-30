import { Card, CardContent } from "@/components/ui/card";
import type { RecentPublished } from "@/hooks/social/useOperationalAnalytics";

interface Props {
  data: RecentPublished[];
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

export function RecentPublishedTable({ data }: Props) {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4">
        <p className="text-sm font-semibold text-foreground mb-3">
          Recently Published
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Caption</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Platform</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Scheduled</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Published</th>
                <th className="text-left py-2 pl-3 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-border/50">
                  <td className="py-2.5 pr-3 text-foreground max-w-[200px] truncate">
                    {row.caption || "—"}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {PLATFORM_LABELS[row.platform] || row.platform}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                    {row.scheduled_at ? new Date(row.scheduled_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                    {row.published_at ? new Date(row.published_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-2.5 pl-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                      Published
                    </span>
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
