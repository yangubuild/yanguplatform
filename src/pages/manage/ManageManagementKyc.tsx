import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminGlassCard, AdminMetricCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  UserCheck, UserPlus, Shield, Clock, Mail, CheckCircle2, XCircle, Users,
} from "lucide-react";
import { toast } from "sonner";

const MANAGEMENT_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "engineer", label: "Engineer" },
  { value: "designer", label: "Designer" },
  { value: "sales_marketing", label: "Sales & Marketing" },
  { value: "finance_lead", label: "Finance Lead" },
  { value: "support_lead", label: "Support Lead" },
  { value: "social_digital", label: "Social & Digital" },
  { value: "analyst", label: "Analyst" },
  { value: "moderator", label: "Moderator" },
  { value: "content_editor", label: "Content Editor" },
];

const DEPARTMENTS = [
  "Engineering", "Design", "Sales & Marketing", "Finance",
  "Support", "Digital Marketing", "Operations", "Content",
];

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  role: string;
  department: string | null;
  kyc_status: string;
  kyc_data: any;
  is_active: boolean;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}

function useTeamMembers() {
  return useQuery({
    queryKey: ["manage", "mgmt-team"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("management_team_members")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TeamMember[];
    },
  });
}

export default function ManageManagementKyc() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ email: "", role: "engineer", department: "Engineering" });
  const { data: members = [], isLoading } = useTeamMembers();

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("management_team_members").insert({
        email: form.email,
        role: form.role,
        department: form.department,
        user_id: "00000000-0000-0000-0000-000000000000", // placeholder until user signs up
        invited_by: user?.id,
        kyc_status: "pending",
        is_active: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Team member invited – they must complete KYC to access the panel");
      queryClient.invalidateQueries({ queryKey: ["manage", "mgmt-team"] });
      setShowInvite(false);
      setForm({ email: "", role: "engineer", department: "Engineering" });
    },
    onError: (e) => toast.error(e.message),
  });

  const kycAction = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const update: any = { kyc_status: status, updated_at: new Date().toISOString() };
      if (status === "approved") update.is_active = true;
      if (status === "rejected") update.is_active = false;
      const { error } = await supabase.from("management_team_members").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("KYC status updated");
      queryClient.invalidateQueries({ queryKey: ["manage", "mgmt-team"] });
    },
  });

  const pending = members.filter((m) => m.kyc_status === "pending").length;
  const approved = members.filter((m) => m.kyc_status === "approved").length;
  const active = members.filter((m) => m.is_active).length;

  const columns: AdminColumn<TeamMember>[] = [
    { key: "email", header: "Email", render: (r) => <span className="text-sm font-mono text-foreground">{r.email}</span> },
    { key: "role", header: "Role", render: (r) => <Badge variant="outline" className="text-xs capitalize">{r.role.replace("_", " ")}</Badge> },
    { key: "department", header: "Department", render: (r) => <span className="text-xs text-muted-foreground">{r.department || "—"}</span> },
    {
      key: "kyc_status",
      header: "KYC Status",
      render: (r) => (
        <AdminStatusBadge
          status={r.kyc_status === "approved" ? "active" : r.kyc_status === "rejected" ? "inactive" : "pending"}
        />
      ),
    },
    { key: "is_active", header: "Access", render: (r) => <AdminStatusBadge status={r.is_active ? "active" : "inactive"} /> },
    { key: "created_at", header: "Invited", render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span> },
    {
      key: "actions",
      header: "",
      render: (r) =>
        r.kyc_status === "pending" ? (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => kycAction.mutate({ id: r.id, status: "approved" })}>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => kycAction.mutate({ id: r.id, status: "rejected" })}>
              <XCircle className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Management Team KYC" subtitle="Invite team members with mandatory KYC verification" />

      <div className="grid gap-4 sm:grid-cols-4">
        <AdminMetricCard label="Total Members" value={members.length} icon={Users} />
        <AdminMetricCard label="Pending KYC" value={pending} icon={Clock} />
        <AdminMetricCard label="KYC Approved" value={approved} icon={Shield} />
        <AdminMetricCard label="Active Access" value={active} icon={UserCheck} />
      </div>

      <AdminGlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]">Team Members</h3>
          <Button onClick={() => setShowInvite(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Invite Member
          </Button>
        </div>
        <AdminTable columns={columns} data={members} loading={isLoading} rowKey={(r) => r.id} />
      </AdminGlassCard>

      <Sheet open={showInvite} onOpenChange={setShowInvite}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Invite Team Member</SheetTitle>
            <SheetDescription>New members must complete KYC (ID + face scan) before accessing the panel</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="team@yangu.io" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Role</label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MANAGEMENT_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Department</label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
              <p className="text-xs text-yellow-500">
                <Shield className="h-3.5 w-3.5 inline mr-1" />
                The invited member will need to complete Didit KYC verification (ID scan + face) before being granted access to the management panel.
              </p>
            </div>
            <Button onClick={() => inviteMutation.mutate()} disabled={!form.email || inviteMutation.isPending} className="w-full">
              {inviteMutation.isPending ? "Sending Invite..." : "Send Invite"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
