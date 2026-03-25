import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, Edit2, Trash2, CalendarDays } from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { toast } from "sonner";

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X (Twitter)" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "Email" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-accent/10 text-accent border-accent/30",
  published: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
};

type ContentPost = {
  id: string;
  title: string;
  platform: string;
  scheduled_for: string;
  status: string;
  notes: string | null;
  created_at: string;
};

export default function AgencyContentCalendar() {
  const { data: ctx } = useAgencyContext();
  const { user } = useAuth();
  const qc = useQueryClient();
  const agencyId = ctx?.agency_id;
  const memberId = ctx?.id;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentPost | null>(null);
  const [form, setForm] = useState({ title: "", platform: "instagram", scheduled_for: "", status: "draft", notes: "" });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["content-calendar", agencyId, format(monthStart, "yyyy-MM")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_calendar")
        .select("id, title, platform, scheduled_for, status, notes, created_at")
        .eq("agency_id", agencyId!)
        .gte("scheduled_for", monthStart.toISOString())
        .lte("scheduled_for", monthEnd.toISOString())
        .order("scheduled_for", { ascending: true });
      if (error) throw error;
      return data as ContentPost[];
    },
    enabled: !!agencyId,
  });

  const upsertMut = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const payload = {
        agency_id: agencyId!,
        title: values.title,
        platform: values.platform,
        scheduled_for: values.scheduled_for,
        status: values.status,
        notes: values.notes || null,
        created_by: memberId,
        updated_at: new Date().toISOString(),
      };

      if (values.id) {
        const { error } = await supabase.from("content_calendar").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("content_calendar").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-calendar"] });
      setDialogOpen(false);
      setEditing(null);
      setForm({ title: "", platform: "instagram", scheduled_for: "", status: "draft", notes: "" });
      toast.success(editing ? "Post updated" : "Post scheduled");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_calendar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-calendar"] });
      toast.success("Post deleted");
    },
  });

  const openEdit = (post: ContentPost) => {
    setEditing(post);
    setForm({
      title: post.title,
      platform: post.platform,
      scheduled_for: post.scheduled_for.slice(0, 16),
      status: post.status,
      notes: post.notes || "",
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", platform: "instagram", scheduled_for: "", status: "draft", notes: "" });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Content Calendar</h1>
          <p className="text-sm text-muted-foreground">Schedule and manage social media posts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" /> New Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Post" : "Schedule New Post"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-muted-foreground uppercase">Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Post title"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground uppercase">Platform</label>
                  <Select value={form.platform} onValueChange={(v) => setForm((p) => ({ ...p, platform: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase">Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase">Scheduled Date & Time</label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_for}
                  onChange={(e) => setForm((p) => ({ ...p, scheduled_for: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase">Notes</label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional notes or caption"
                  className="mt-1"
                  rows={3}
                />
              </div>
              <Button
                className="w-full"
                disabled={!form.title || !form.scheduled_for || upsertMut.isPending}
                onClick={() => upsertMut.mutate({ ...form, id: editing?.id })}
              >
                {editing ? "Update Post" : "Schedule Post"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
          ← Prev
        </Button>
        <span className="text-sm font-medium text-foreground">{format(currentMonth, "MMMM yyyy")}</span>
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
          Next →
        </Button>
      </div>

      {/* Posts list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : !posts?.length ? (
        <Card className="border border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">No posts scheduled</p>
            <p className="text-xs text-muted-foreground mt-1">Click "New Post" to create your first entry</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <Card key={post.id} className="border border-border">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[post.status] || ""}`}>
                      {post.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="capitalize">{post.platform}</span>
                    <span>·</span>
                    <span>{format(new Date(post.scheduled_for), "MMM d, yyyy h:mm a")}</span>
                  </div>
                  {post.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{post.notes}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(post)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteMut.mutate(post.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
