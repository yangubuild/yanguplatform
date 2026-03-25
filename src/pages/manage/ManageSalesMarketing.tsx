import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGlassCard, AdminMetricCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Megaphone, Mail, Users, Calendar, FileCheck, Building2,
  Send, CheckCircle2, Clock, UserPlus, BarChart3, Loader2, TestTube,
} from "lucide-react";
import { toast } from "sonner";

function useAgencyOnboarding() {
  return useQuery({
    queryKey: ["manage", "agency-onboarding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useEmailTriggers() {
  return useQuery({
    queryKey: ["manage", "email-triggers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_triggers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useApprovalRequests() {
  return useQuery({
    queryKey: ["manage", "approval-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approval_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function ManageSalesMarketing() {
  const queryClient = useQueryClient();
  const { data: agencies = [], isLoading: agLoading } = useAgencyOnboarding();
  const { data: triggers = [], isLoading: trLoading } = useEmailTriggers();
  const { data: approvals = [], isLoading: apLoading } = useApprovalRequests();

  const [showTestSend, setShowTestSend] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<any>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testSubject, setTestSubject] = useState("");
  const [testHtml, setTestHtml] = useState("");

  const pendingAgencies = agencies.filter((a: any) => a.status === "pending");
  const activeAgencies = agencies.filter((a: any) => a.status === "active");
  const pendingApprovals = approvals.filter((a: any) => a.status === "pending");

  const totalSent = triggers.reduce((sum: number, t: any) => sum + (t.sent_count || 0), 0);
  const totalOpens = triggers.reduce((sum: number, t: any) => sum + (t.open_count || 0), 0);
  const totalClicks = triggers.reduce((sum: number, t: any) => sum + (t.click_count || 0), 0);

  const testSendMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-email-campaign", {
        body: {
          test_email: testEmail,
          subject: testSubject || "Test Campaign Email",
          html_content: testHtml || "<p>This is a test email from YANGU Management.</p>",
          trigger_id: selectedTrigger?.id,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(`Test email sent to ${testEmail}`);
      setShowTestSend(false);
      setTestEmail("");
    },
    onError: (e) => toast.error(`Test send failed: ${e.message}`),
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (triggerId: string) => {
      const { data, error } = await supabase.functions.invoke("send-email-campaign", {
        body: { trigger_id: triggerId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Campaign sent: ${data?.sent_count || 0} emails delivered`);
      queryClient.invalidateQueries({ queryKey: ["manage", "email-triggers"] });
    },
    onError: (e) => toast.error(`Campaign failed: ${e.message}`),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Sales & Marketing" description="Email campaigns, agency onboarding, asset approvals" />

      <div className="grid gap-4 sm:grid-cols-4">
        <AdminMetricCard label="Active Agencies" value={activeAgencies.length} icon={<Building2 className="h-4 w-4" />} />
        <AdminMetricCard label="Total Emails Sent" value={totalSent} icon={<Mail className="h-4 w-4" />} />
        <AdminMetricCard label="Total Opens" value={totalOpens} icon={<BarChart3 className="h-4 w-4" />} />
        <AdminMetricCard label="Total Clicks" value={totalClicks} icon={<Megaphone className="h-4 w-4" />} />
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
          <TabsTrigger value="onboarding">Agency Onboarding</TabsTrigger>
          <TabsTrigger value="approvals">Asset Approvals</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4">
          <AdminGlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]">Email Campaign Triggers</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSelectedTrigger(null); setShowTestSend(true); }}
                >
                  <TestTube className="h-4 w-4 mr-2" /> Test Send
                </Button>
                <Button size="sm"><Send className="h-4 w-4 mr-2" /> Create Campaign</Button>
              </div>
            </div>
            {triggers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No email triggers configured</p>
                <p className="text-xs mt-1">Set up automated campaigns for user segments</p>
              </div>
            ) : (
              <AdminTable
                columns={[
                  { key: "trigger_name", header: "Campaign", render: (r: any) => <span className="text-sm font-medium text-foreground">{r.trigger_name}</span> },
                  { key: "trigger_event", header: "Trigger", render: (r: any) => <Badge variant="outline" className="text-xs">{r.trigger_event}</Badge> },
                  { key: "is_active", header: "Status", render: (r: any) => <AdminStatusBadge status={r.is_active ? "active" : "inactive"} /> },
                  { key: "sent_count", header: "Sent", render: (r: any) => <span className="text-xs font-mono">{r.sent_count || 0}</span> },
                  { key: "open_count", header: "Opens", render: (r: any) => <span className="text-xs font-mono">{r.open_count || 0}</span> },
                  { key: "click_count", header: "Clicks", render: (r: any) => <span className="text-xs font-mono">{r.click_count || 0}</span> },
                  { key: "last_sent_at", header: "Last Sent", render: (r: any) => <span className="text-xs text-muted-foreground">{r.last_sent_at ? new Date(r.last_sent_at).toLocaleString() : "Never"}</span> },
                  {
                    key: "actions",
                    header: "",
                    render: (r: any) => (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedTrigger(r); setShowTestSend(true); }}
                          title="Test Send"
                        >
                          <TestTube className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Send campaign "${r.trigger_name}" to all matching users?`)) {
                              sendCampaignMutation.mutate(r.id);
                            }
                          }}
                          disabled={sendCampaignMutation.isPending}
                          title="Send Campaign"
                        >
                          {sendCampaignMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 text-emerald-500" />
                          )}
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={triggers}
                loading={trLoading}
                rowKey={(r: any) => r.id}
              />
            )}
          </AdminGlassCard>
        </TabsContent>

        <TabsContent value="onboarding" className="mt-4">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4">Agency Onboarding Pipeline</h3>
            <div className="grid gap-3 sm:grid-cols-3 mb-4">
              {[
                { label: "Pending Review", count: pendingAgencies.length, color: "text-yellow-500" },
                { label: "Active", count: activeAgencies.length, color: "text-emerald-500" },
                { label: "Total", count: agencies.length, color: "text-[hsl(var(--admin-accent))]" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-[hsl(var(--admin-border)/0.3)] p-3 text-center">
                  <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            <AdminTable
              columns={[
                { key: "name", header: "Agency", render: (r: any) => <span className="text-sm font-medium text-foreground">{r.name}</span> },
                { key: "slug", header: "Slug", render: (r: any) => <span className="text-xs font-mono text-muted-foreground">{r.slug}</span> },
                { key: "region", header: "Region", render: (r: any) => <span className="text-xs text-muted-foreground">{r.region || "—"}</span> },
                { key: "status", header: "Status", render: (r: any) => <AdminStatusBadge status={r.status === "active" ? "active" : r.status === "pending" ? "pending" : "inactive"} /> },
                { key: "created_at", header: "Applied", render: (r: any) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span> },
              ]}
              data={agencies}
              loading={agLoading}
              rowKey={(r: any) => r.id}
            />
          </AdminGlassCard>
        </TabsContent>

        <TabsContent value="approvals" className="mt-4">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4">Asset Approval Queue</h3>
            {pendingApprovals.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No pending asset approvals
              </div>
            ) : (
              <AdminTable
                columns={[
                  { key: "title", header: "Request", render: (r: any) => <span className="text-sm font-medium">{r.title || r.request_type}</span> },
                  { key: "request_type", header: "Type", render: (r: any) => <Badge variant="outline" className="text-xs">{r.request_type}</Badge> },
                  { key: "status", header: "Status", render: (r: any) => <AdminStatusBadge status={r.status === "approved" ? "active" : r.status === "rejected" ? "inactive" : "pending"} /> },
                  { key: "created_at", header: "Submitted", render: (r: any) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span> },
                ]}
                data={approvals}
                loading={apLoading}
                rowKey={(r: any) => r.id}
              />
            )}
          </AdminGlassCard>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4">Sales Calendar</h3>
            <div className="py-12 text-center text-muted-foreground text-sm">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Calendar integration coming soon</p>
              <p className="text-xs mt-1">Connect Calendly or Google Calendar for meeting scheduling</p>
            </div>
          </AdminGlassCard>
        </TabsContent>
      </Tabs>

      {/* Test Send Sheet */}
      <Sheet open={showTestSend} onOpenChange={setShowTestSend}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Test Email Send</SheetTitle>
            <SheetDescription>
              {selectedTrigger
                ? `Send a test of "${selectedTrigger.trigger_name}" to a single email`
                : "Send a test email via Resend"}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Recipient Email</label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Subject</label>
              <Input
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
                placeholder={selectedTrigger?.trigger_name || "Test Campaign Email"}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">HTML Content</label>
              <Textarea
                value={testHtml}
                onChange={(e) => setTestHtml(e.target.value)}
                placeholder={selectedTrigger?.template_content || "<p>Hello from YANGU Management</p>"}
                rows={6}
              />
            </div>
            <Button
              onClick={() => testSendMutation.mutate()}
              disabled={!testEmail || testSendMutation.isPending}
              className="w-full"
            >
              {testSendMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><TestTube className="h-4 w-4 mr-2" /> Send Test Email</>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
