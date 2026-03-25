import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGlassCard, AdminMetricCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Megaphone, Mail, Users, Calendar, FileCheck, Building2,
  Send, CheckCircle2, Clock, UserPlus, BarChart3,
} from "lucide-react";

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
  const { data: agencies = [], isLoading: agLoading } = useAgencyOnboarding();
  const { data: triggers = [], isLoading: trLoading } = useEmailTriggers();
  const { data: approvals = [], isLoading: apLoading } = useApprovalRequests();

  const pendingAgencies = agencies.filter((a: any) => a.status === "pending");
  const activeAgencies = agencies.filter((a: any) => a.status === "active");
  const pendingApprovals = approvals.filter((a: any) => a.status === "pending");

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Sales & Marketing" subtitle="Email campaigns, agency onboarding, asset approvals" />

      <div className="grid gap-4 sm:grid-cols-4">
        <AdminMetricCard label="Active Agencies" value={activeAgencies.length} icon={Building2} />
        <AdminMetricCard label="Pending Applications" value={pendingAgencies.length} icon={Clock} />
        <AdminMetricCard label="Email Triggers" value={triggers.length} icon={Mail} />
        <AdminMetricCard label="Pending Approvals" value={pendingApprovals.length} icon={FileCheck} />
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
              <Button size="sm"><Send className="h-4 w-4 mr-2" /> Create Campaign</Button>
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
                  { key: "fire_count", header: "Sent", render: (r: any) => <span className="text-xs font-mono">{r.fire_count}</span> },
                  { key: "last_fired_at", header: "Last Fired", render: (r: any) => <span className="text-xs text-muted-foreground">{r.last_fired_at ? new Date(r.last_fired_at).toLocaleString() : "Never"}</span> },
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
    </div>
  );
}
