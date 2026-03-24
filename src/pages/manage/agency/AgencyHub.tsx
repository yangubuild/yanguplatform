import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Plus, Clock, X, Pencil } from "lucide-react";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useHubBookings, useCreateHubBooking } from "@/hooks/manage/useAgencyHubBookings";
import { useCancelHubBooking, useModifyHubBooking } from "@/hooks/manage/useHubActions";
import { toast } from "sonner";

export default function AgencyHub() {
  const { data: ctx, isLoading: ctxLoading } = useAgencyContext();
  const agencyId = ctx?.agency_id;
  const { data: bookings, isLoading } = useHubBookings(agencyId);
  const createBooking = useCreateHubBooking(agencyId);
  const cancelBooking = useCancelHubBooking(agencyId);
  const modifyBooking = useModifyHubBooking(agencyId);
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState("");
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("17:00");
  const [formNotes, setFormNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  if (ctxLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  const confirmed = bookings?.filter((b) => b.status === "confirmed") ?? [];
  const thisWeek = confirmed.filter((b) => {
    const d = new Date(b.booking_date);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    return d >= weekStart;
  });

  const weeklyHours = thisWeek.reduce((sum, b) => {
    const start = b.start_time.split(":").map(Number);
    const end = b.end_time.split(":").map(Number);
    return sum + (end[0] - start[0]) + (end[1] - start[1]) / 60;
  }, 0);

  const handleSubmit = async () => {
    if (!formDate) { toast.error("Please select a date"); return; }
    try {
      if (editingId) {
        await modifyBooking.mutateAsync({ bookingId: editingId, date: formDate, start: formStart, end: formEnd, notes: formNotes || undefined });
      } else {
        await createBooking.mutateAsync({ date: formDate, start: formStart, end: formEnd, notes: formNotes || undefined });
      }
      resetForm();
    } catch (e: any) {
      toast.error(e.message || "Failed to save booking");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormDate("");
    setFormStart("09:00");
    setFormEnd("17:00");
    setFormNotes("");
  };

  const startEdit = (b: any) => {
    setEditingId(b.id);
    setFormDate(b.booking_date);
    setFormStart(b.start_time.slice(0, 5));
    setFormEnd(b.end_time.slice(0, 5));
    setFormNotes(b.notes ?? "");
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Hub Booking</h1>
          <p className="text-sm text-[hsl(var(--admin-text-muted))]">Schedule and track hub usage · Min 10 hours/week</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Book Slot
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">This Week</p>
            <p className="text-2xl font-bold text-foreground mt-1">{weeklyHours.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">of 10h minimum</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Confirmed</p>
            <p className="text-2xl font-bold text-foreground mt-1">{confirmed.length}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Status</p>
            <Badge variant={weeklyHours >= 10 ? "default" : "secondary"} className="mt-2">
              {weeklyHours >= 10 ? "On Track" : "Below Minimum"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{editingId ? "Modify Booking" : "New Booking"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              <Input type="time" value={formStart} onChange={(e) => setFormStart(e.target.value)} />
              <Input type="time" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} />
            </div>
            <Input placeholder="Notes (optional)" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={createBooking.isPending || modifyBooking.isPending}>
                {editingId ? "Update Booking" : "Confirm Booking"}
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border border-border">
        <CardHeader className="pb-3"><CardTitle className="text-sm">Upcoming Bookings</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-3 sm:px-4 py-3">Date</th>
                <th className="px-3 sm:px-4 py-3">Time</th>
                <th className="px-3 sm:px-4 py-3 hidden sm:table-cell">Booked By</th>
                <th className="px-3 sm:px-4 py-3">Status</th>
                <th className="px-3 sm:px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(bookings?.length ?? 0) === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No bookings yet</td></tr>
              ) : (
                bookings!.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30">
                    <td className="px-3 sm:px-4 py-3 text-foreground">{new Date(b.booking_date).toLocaleDateString()}</td>
                    <td className="px-3 sm:px-4 py-3 text-foreground whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground hidden sm:inline" />
                        {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-foreground hidden sm:table-cell">{b.booker_name ?? "—"}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <Badge variant={b.status === "confirmed" ? "default" : b.status === "cancelled" ? "destructive" : "secondary"} className="text-xs">{b.status}</Badge>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      {b.status !== "cancelled" && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(b)} title="Modify">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => cancelBooking.mutate(b.id)}
                            disabled={cancelBooking.isPending}
                            title="Cancel">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
