import { AdminGlassCard, AdminMetricCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Share2, Globe, TrendingUp, Eye, MousePointer, BarChart3,
  Instagram, Calendar, Plug, Search, Activity,
} from "lucide-react";

const SOCIAL_PLATFORMS = [
  { name: "Instagram", icon: Instagram, connected: false, followers: "—" },
  { name: "TikTok", icon: Activity, connected: false, followers: "—" },
  { name: "Facebook", icon: Globe, connected: false, followers: "—" },
  { name: "X (Twitter)", icon: Share2, connected: false, followers: "—" },
  { name: "LinkedIn", icon: Globe, connected: false, followers: "—" },
  { name: "YouTube", icon: Activity, connected: false, followers: "—" },
];

const THIRD_PARTY_TOOLS = [
  { name: "Buffer", status: "not_connected", description: "Social media scheduling" },
  { name: "Hootsuite", status: "not_connected", description: "Social media management" },
  { name: "Sprout Social", status: "not_connected", description: "Social analytics & engagement" },
  { name: "Google Analytics", status: "not_connected", description: "Web analytics" },
  { name: "Google Search Console", status: "not_connected", description: "SEO & search performance" },
];

export default function ManageDigitalMarketing() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Digital Marketing" subtitle="Social media, SEO, analytics & performance tracking" />

      <div className="grid gap-4 sm:grid-cols-4">
        <AdminMetricCard label="Connected Platforms" value={0} icon={Share2} />
        <AdminMetricCard label="Total Reach" value="—" icon={Eye} />
        <AdminMetricCard label="Engagement Rate" value="—" icon={MousePointer} />
        <AdminMetricCard label="SEO Score" value="—" icon={Search} />
      </div>

      <Tabs defaultValue="social">
        <TabsList>
          <TabsTrigger value="social">Social Accounts</TabsTrigger>
          <TabsTrigger value="scheduler">Post Scheduler</TabsTrigger>
          <TabsTrigger value="seo">SEO & Rankings</TabsTrigger>
          <TabsTrigger value="heatmaps">Hot Mapping</TabsTrigger>
          <TabsTrigger value="tools">Third-Party Tools</TabsTrigger>
          <TabsTrigger value="daily-report">Daily Report</TabsTrigger>
        </TabsList>

        <TabsContent value="social" className="mt-4">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4">Social Media Accounts</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SOCIAL_PLATFORMS.map((platform) => (
                <div key={platform.name} className="rounded-lg border border-[hsl(var(--admin-border)/0.3)] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <platform.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-[hsl(var(--admin-text))]">{platform.name}</span>
                    </div>
                    <Badge variant="outline" className={platform.connected ? "text-emerald-500 border-emerald-500/30" : "text-muted-foreground"}>
                      {platform.connected ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Followers: {platform.followers}</span>
                    <Button variant="outline" size="sm" className="text-xs">
                      {platform.connected ? "Manage" : "Connect"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </AdminGlassCard>
        </TabsContent>

        <TabsContent value="scheduler" className="mt-4">
          <AdminGlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]">Post Scheduler</h3>
              <Button size="sm"><Calendar className="h-4 w-4 mr-2" /> Schedule Post</Button>
            </div>
            <div className="py-12 text-center text-muted-foreground text-sm">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No scheduled posts yet</p>
              <p className="text-xs mt-1">Connect your social accounts first to start scheduling</p>
            </div>
          </AdminGlassCard>
        </TabsContent>

        <TabsContent value="seo" className="mt-4">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4">SEO & Domain Rankings</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { domain: "yangu.io", rank: "—", visits: "—", trend: "—" },
                { domain: "yangu.shop", rank: "—", visits: "—", trend: "—" },
                { domain: "yangu.store", rank: "—", visits: "—", trend: "—" },
                { domain: "yangu.studio", rank: "—", visits: "—", trend: "—" },
              ].map((d) => (
                <div key={d.domain} className="rounded-lg border border-[hsl(var(--admin-border)/0.3)] p-3">
                  <p className="text-sm font-mono font-medium text-foreground">{d.domain}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Rank: {d.rank}</span>
                    <span>Daily Visits: {d.visits}</span>
                    <span>Trend: {d.trend}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">Connect Google Search Console for live data</p>
          </AdminGlassCard>
        </TabsContent>

        <TabsContent value="heatmaps" className="mt-4">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4">Click Heatmaps & User Journey</h3>
            <div className="py-12 text-center text-muted-foreground text-sm">
              <MousePointer className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Heatmap tracking not yet configured</p>
              <p className="text-xs mt-1">Integrate with Hotjar, Microsoft Clarity, or PostHog for click heatmaps</p>
              <Button variant="outline" size="sm" className="mt-4">
                <Plug className="h-4 w-4 mr-2" /> Configure Analytics
              </Button>
            </div>
          </AdminGlassCard>
        </TabsContent>

        <TabsContent value="tools" className="mt-4">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4">Third-Party Integrations</h3>
            <div className="space-y-3">
              {THIRD_PARTY_TOOLS.map((tool) => (
                <div key={tool.name} className="flex items-center justify-between rounded-lg border border-[hsl(var(--admin-border)/0.3)] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--admin-text))]">{tool.name}</p>
                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Plug className="h-3.5 w-3.5 mr-1.5" /> Connect
                  </Button>
                </div>
              ))}
            </div>
          </AdminGlassCard>
        </TabsContent>

        <TabsContent value="daily-report" className="mt-4">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4">ADA Daily Performance Report</h3>
            <div className="py-12 text-center text-muted-foreground text-sm">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Daily reports are generated automatically at midnight UTC</p>
              <p className="text-xs mt-1">Includes: visits, signups, conversions, retention metrics</p>
            </div>
          </AdminGlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
