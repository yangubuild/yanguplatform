import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminGlassCard, AdminMetricCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileBarChart, Plus, Calendar, Building2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const DEPARTMENTS = [
  "Engineering", "Design", "Sales & Marketing", "Finance",
  "Support", "Digital Marketing", "Operations", "Management",
];

interface DeptReport {
  id: string;
  department: string;
  report_date: string;
  summary: string | null;
  data: any;
  highlights: string[] | null;
  blockers: string[] | null;
  created_by: string | null;
  created_at: string;
}

function useReports(dept: string) {
  return useQuery({
    queryKey: ["manage", "dept-reports", dept],
    queryFn: async () => {
      let q = supabase
        .from("department_reports")
        .select("*")
        .order("report_date", { ascending: false })
        .limit(100);
      if (dept !== "all") q = q.eq("department", dept);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as DeptReport[];
    },
  });
}

export default function ManageDepartmentReports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deptFilter, setDeptFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    department: "Engineering",
    report_date: format(new Date(), "yyyy-MM-dd"),
    summary: "",
    highlights: "",
    blockers: "",
  });

  const { data: reports = [], isLoading } = useReports(deptFilter);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("department_reports").insert({
        department: form.department,
        report_date: form.report_date,
        summary: form.summary || null,
        highlights: form.highlights ? form.highlights.split("\n").filter(Boolean) : null,
        blockers: form.blockers ? form.blockers.split("\n").filter(Boolean) : null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report submitted");
      queryClient.invalidateQueries({ queryKey: ["manage", "dept-reports"] });
      setShowCreate(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const todayReports = reports.filter((r) => r.report_date === format(new Date(), "yyyy-MM-dd"));

  const columns: AdminColumn<DeptReport>[] = [
    { key: "department", header: "Department", render: (r) => <Badge variant="outline" className="text-xs">{r.department}</Badge> },
    { key: "report_date", header: "Date", render: (r) => <span className="text-xs font-mono text-muted-foreground">{r.report_date}</span> },
    { key: "summary", header: "Summary", render: (r) => <span className="text-sm text-foreground truncate max-w-[300px] block">{r.summary || "—"}</span> },
    {
      key: "highlights",
      header: "Highlights",
      render: (r) => (
        <div className="flex gap-1 flex-wrap">
          {(r.highlights || []).slice(0, 2).map((h, i) => (
            <Badge key={i} variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">{h}</Badge>
          ))}
          {(r.highlights?.length || 0) > 2 && <Badge variant="outline" className="text-[10px]">+{(r.highlights?.length || 0) - 2}</Badge>}
        </div>
      ),
    },
    {
      key: "blockers",
      header: "Blockers",
      render: (r) =>
        r.blockers && r.blockers.length > 0 ? (
          <Badge variant="outline" className="text-xs text-red-400 border-red-500/30">
            <AlertTriangle className="h-3 w-3 mr-1" /> {r.blockers.length}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Department Reports" subtitle="Cross-department daily reporting & coordination" />

      <div className="grid gap-4 sm:grid-cols-4">
        <AdminMetricCard label="Total Reports" value={reports.length} icon={FileBarChart} />
        <AdminMetricCard label="Today's Reports" value={todayReports.length} icon={Calendar} />
        <AdminMetricCard label="Departments" value={DEPARTMENTS.length} icon={Building2} />
        <AdminMetricCard label="With Blockers" value={reports.filter((r) => r.blockers && r.blockers.length > 0).length} icon={AlertTriangle} />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="approvals">Approval Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <AdminGlassCard>
            <div className="flex items-center justify-between mb-4">
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Filter by department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" /> Submit Report
              </Button>
            </div>
            <AdminTable columns={columns} data={reports} loading={isLoading} rowKey={(r) => r.id} />
          </AdminGlassCard>
        </TabsContent>

        <TabsContent value="today" className="mt-4">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4">Today's Reports</h3>
            {todayReports.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No reports submitted today yet
              </div>
            ) : (
              <AdminTable columns={columns} data={todayReports} loading={isLoading} rowKey={(r) => r.id} />
            )}
          </AdminGlassCard>
        </TabsContent>

        <TabsContent value="approvals" className="mt-4">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4">Approval Notifications</h3>
            <div className="py-8 text-center text-muted-foreground text-sm">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No pending approvals
            </div>
          </AdminGlassCard>
        </TabsContent>
      </Tabs>

      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent>
          <SheetHeader><SheetTitle>Submit Department Report</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Department</label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Date</label>
              <Input type="date" value={form.report_date} onChange={(e) => setForm({ ...form, report_date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Summary</label>
              <Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={3} placeholder="What was accomplished today?" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Highlights (one per line)</label>
              <Textarea value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} rows={3} placeholder="Shipped feature X&#10;Fixed critical bug" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Blockers (one per line)</label>
              <Textarea value={form.blockers} onChange={(e) => setForm({ ...form, blockers: e.target.value })} rows={2} placeholder="Waiting on API access&#10;Design review pending" />
            </div>
            <Button onClick={() => createMutation.mutate()} disabled={!form.summary || createMutation.isPending} className="w-full">
              {createMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
