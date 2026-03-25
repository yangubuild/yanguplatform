import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useRoles } from "@/hooks/useRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Target, ListChecks, CalendarDays, Plus, Save, Loader2, CheckCircle2, Clock, User,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { toast } from "sonner";

// ─── Weekly Goals Section ────────────────────────────────────
function WeeklyGoals({ agencyId, memberId, canEdit }: { agencyId: string; memberId: string; canEdit: boolean }) {
  const qc = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const now = new Date();
  const weekStart = startOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 });

  const { data: goal, isLoading } = useQuery({
    queryKey: ["vision-goals", agencyId, format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vision_board_goals")
        .select("*")
        .eq("agency_id", agencyId)
        .eq("goal_type", "weekly")
        .eq("period_start", format(weekStart, "yyyy-MM-dd"))
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [targetKyc, setTargetKyc] = useState(100);
  const [targetSubs, setTargetSubs] = useState(20);
  const [saving, setSaving] = useState(false);

  const saveGoal = async () => {
    setSaving(true);
    try {
      if (goal) {
        await supabase.from("vision_board_goals").update({
          target_kyc_users: targetKyc,
          target_subscribers: targetSubs,
        }).eq("id", goal.id);
      } else {
        await supabase.from("vision_board_goals").insert({
          agency_id: agencyId,
          goal_type: "weekly",
          target_kyc_users: targetKyc,
          target_subscribers: targetSubs,
          period_start: format(weekStart, "yyyy-MM-dd"),
          period_end: format(weekEnd, "yyyy-MM-dd"),
          created_by: memberId,
        });
      }
      qc.invalidateQueries({ queryKey: ["vision-goals"] });
      toast.success("Weekly goal saved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const kycTarget = goal?.target_kyc_users ?? targetKyc;
  const kycActual = goal?.actual_kyc_users ?? 0;
  const subsTarget = goal?.target_subscribers ?? targetSubs;
  const subsActual = goal?.actual_subscribers ?? 0;
  const kycPct = kycTarget > 0 ? Math.min((kycActual / kycTarget) * 100, 100) : 0;
  const subsPct = subsTarget > 0 ? Math.min((subsActual / subsTarget) * 100, 100) : 0;

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" /> Weekly Goals
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setWeekOffset((o) => o - 1)}>←</Button>
            <span className="text-muted-foreground">
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d")}
            </span>
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setWeekOffset((o) => o + 1)} disabled={weekOffset >= 0}>→</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          <>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground">KYC Users: {kycActual} / {kycTarget}</span>
                <span className="text-muted-foreground">{kycPct.toFixed(0)}%</span>
              </div>
              <Progress value={kycPct} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground">Subscribers: {subsActual} / {subsTarget}</span>
                <span className="text-muted-foreground">{subsPct.toFixed(0)}%</span>
              </div>
              <Progress value={subsPct} className="h-2" />
            </div>
            {canEdit && weekOffset === 0 && (
              <div className="flex items-end gap-3 pt-2 border-t border-border">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase">KYC Target</label>
                  <Input type="number" className="h-8 w-20 text-sm mt-0.5" value={goal ? kycTarget : targetKyc} onChange={(e) => setTargetKyc(parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase">Sub Target</label>
                  <Input type="number" className="h-8 w-20 text-sm mt-0.5" value={goal ? subsTarget : targetSubs} onChange={(e) => setTargetSubs(parseInt(e.target.value) || 0)} />
                </div>
                <Button size="sm" className="h-8" onClick={saveGoal} disabled={saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Team Tasks Section ──────────────────────────────────────
function TeamTasks({ agencyId, memberId, canManage, isLeader }: {
  agencyId: string; memberId: string; canManage: boolean; isLeader: boolean;
}) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "mine" | "overdue">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assigned_to: "", due_date: "" });

  // Get team members for assignment dropdown
  const { data: members } = useQuery({
    queryKey: ["agency-members-list", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_members")
        .select("id, role, user_id, profiles:user_id(display_name, username)")
        .eq("agency_id", agencyId)
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
    enabled: canManage,
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["vision-tasks", agencyId, filter],
    queryFn: async () => {
      let q = supabase
        .from("vision_board_tasks")
        .select("*")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false });

      if (filter === "mine") q = q.eq("assigned_to", memberId);
      if (filter === "overdue") q = q.lt("due_date", format(new Date(), "yyyy-MM-dd")).neq("status", "completed");

      const { data, error } = await q.limit(50);
      if (error) throw error;
      return data;
    },
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("vision_board_tasks").update({
        status: completed ? "completed" : "pending",
        completed_at: completed ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vision-tasks"] }),
  });

  const createTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vision_board_tasks").insert({
        agency_id: agencyId,
        title: form.title,
        description: form.description || null,
        assigned_to: form.assigned_to || null,
        due_date: form.due_date || null,
        created_by: memberId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vision-tasks"] });
      setDialogOpen(false);
      setForm({ title: "", description: "", assigned_to: "", due_date: "" });
      toast.success("Task created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ListChecks className="w-4 h-4" /> Team Tasks
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(["all", "mine", "overdue"] as const).map((f) => (
                <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className="h-6 px-2 text-[10px]" onClick={() => setFilter(f)}>
                  {f === "all" ? "All" : f === "mine" ? "Mine" : "Overdue"}
                </Button>
              ))}
            </div>
            {canManage && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-7"><Plus className="h-3.5 w-3.5 mr-1" /> Task</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <Input placeholder="Task title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                    <Textarea placeholder="Description (optional)" rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Assign to</label>
                        <Select value={form.assigned_to} onValueChange={(v) => setForm((p) => ({ ...p, assigned_to: v }))}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select member" /></SelectTrigger>
                          <SelectContent>
                            {members?.map((m: any) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.profiles?.display_name || m.profiles?.username || m.role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Due date</label>
                        <Input type="date" className="mt-1" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} />
                      </div>
                    </div>
                    <Button className="w-full" disabled={!form.title || createTask.isPending} onClick={() => createTask.mutate()}>
                      Create Task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : !tasks?.length ? (
          <p className="text-xs text-muted-foreground text-center py-6">No tasks found</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((t: any) => {
              const isOverdue = t.due_date && t.status !== "completed" && new Date(t.due_date) < new Date();
              return (
                <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <Checkbox
                    checked={t.status === "completed"}
                    onCheckedChange={(checked) => toggleTask.mutate({ id: t.id, completed: !!checked })}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${t.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {t.title}
                    </p>
                    {t.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {t.due_date && (
                        <Badge variant={isOverdue ? "destructive" : "outline"} className="text-[10px]">
                          {format(new Date(t.due_date), "MMM d")}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">{t.status}</Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Hub Events Section ──────────────────────────────────────
function HubEvents({ agencyId, memberId, canManage }: { agencyId: string; memberId: string; canManage: boolean }) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", event_date: "", start_time: "", end_time: "", purpose: "training", location: "" });

  const { data: events, isLoading } = useQuery({
    queryKey: ["hub-events", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hub_events")
        .select("*")
        .eq("agency_id", agencyId)
        .gte("event_date", format(new Date(), "yyyy-MM-dd"))
        .order("event_date", { ascending: true })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const createEvent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("hub_events").insert({
        agency_id: agencyId,
        title: form.title,
        event_date: form.event_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        purpose: form.purpose,
        location: form.location || null,
        created_by: memberId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hub-events"] });
      setDialogOpen(false);
      setForm({ title: "", event_date: "", start_time: "", end_time: "", purpose: "training", location: "" });
      toast.success("Event created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const PURPOSE_LABELS: Record<string, string> = {
    training: "Training", meeting: "Meeting", content_creation: "Content", event: "Event",
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Hub Events
          </CardTitle>
          {canManage && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-7"><Plus className="h-3.5 w-3.5 mr-1" /> Event</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Hub Event</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input placeholder="Event title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Date</label>
                      <Input type="date" className="mt-1" value={form.event_date} onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Purpose</label>
                      <Select value={form.purpose} onValueChange={(v) => setForm((p) => ({ ...p, purpose: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="training">Training</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="content_creation">Content Creation</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Start time</label>
                      <Input type="time" className="mt-1" value={form.start_time} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">End time</label>
                      <Input type="time" className="mt-1" value={form.end_time} onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} />
                    </div>
                  </div>
                  <Input placeholder="Location (hub name)" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
                  <Button className="w-full" disabled={!form.title || !form.event_date || createEvent.isPending} onClick={() => createEvent.mutate()}>
                    Create Event
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : !events?.length ? (
          <p className="text-xs text-muted-foreground text-center py-6">No upcoming events</p>
        ) : (
          <div className="space-y-2">
            {events.map((e: any) => (
              <div key={e.id} className="p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{e.title}</p>
                  <Badge variant="outline" className="text-[10px]">{PURPOSE_LABELS[e.purpose] || e.purpose}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>{format(new Date(e.event_date), "EEE, MMM d")}</span>
                  {e.start_time && <span>{e.start_time.slice(0, 5)}{e.end_time ? ` – ${e.end_time.slice(0, 5)}` : ""}</span>}
                  {e.location && <span>· {e.location}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Vision Board ───────────────────────────────────────
export default function AgencyVisionBoard() {
  const { data: ctx, isLoading: ctxLoading } = useAgencyContext();
  const { isAgencyAdmin, isAgencyManager, isAdmin } = useRoles();
  const agencyId = ctx?.agency_id;
  const memberId = ctx?.id;
  const isLeader = isAdmin || isAgencyAdmin || isAgencyManager;

  if (ctxLoading || !agencyId || !memberId) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Vision Board</h1>
        <p className="text-sm text-muted-foreground">Weekly goals, team tasks, and hub event planning</p>
      </div>
      <WeeklyGoals agencyId={agencyId} memberId={memberId} canEdit={isLeader} />
      <TeamTasks agencyId={agencyId} memberId={memberId} canManage={isLeader} isLeader={isLeader} />
      <HubEvents agencyId={agencyId} memberId={memberId} canManage={isLeader} />
    </div>
  );
}
