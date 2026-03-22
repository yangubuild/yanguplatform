import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleApi } from "@/hooks/useGoogleApi";
import { ArrowLeft, RefreshCw, Plus, Loader2, Video, Calendar, ExternalLink, Copy, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  meetLink: string | null;
  htmlLink: string | null;
  attendees: { email: string; status?: string }[];
};

export default function GoogleMeetPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { callApi, loading, error } = useGoogleApi();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [attendeesInput, setAttendeesInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdMeetLink, setCreatedMeetLink] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    const result = await callApi<{ events: CalendarEvent[] }>("calendar/events", { maxResults: 20 });
    if (result) {
      setEvents(result.events || []);
      setHasLoaded(true);
    }
  }, [callApi]);

  useEffect(() => {
    if (user?.id) fetchEvents();
  }, [user?.id, fetchEvents]);

  const handleCreate = async () => {
    if (!title.trim() || !startDate || !endDate) return;
    setCreating(true);
    setCreatedMeetLink(null);

    const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${endDate}T${endTime}:00`).toISOString();
    const attendees = attendeesInput.split(",").map(e => e.trim()).filter(Boolean);

    const result = await callApi<{ ok: boolean; meetLink?: string; id?: string }>("calendar/create", {
      summary: title,
      description,
      startDateTime,
      endDateTime,
      attendees,
      addMeetLink: true,
    });

    setCreating(false);

    if (result?.ok) {
      toast.success("Meeting created!");
      if (result.meetLink) {
        setCreatedMeetLink(result.meetLink);
      }
      fetchEvents();
      // Reset form after a moment
      setTitle("");
      setDescription("");
      setAttendeesInput("");
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Meet link copied!");
  };

  const formatEventTime = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Set default dates
  useEffect(() => {
    if (!startDate) {
      const today = new Date().toISOString().split("T")[0];
      setStartDate(today);
      setEndDate(today);
    }
  }, [startDate]);

  return (
    <div className="w-full min-h-screen px-6 py-6 bg-background">
      <button
        onClick={() => navigate("/dashboard/my-apps")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to My Apps
      </button>

      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Google Meet</h1>
            <p className="text-sm text-muted-foreground mt-1">Schedule meetings and generate links inside YANGU</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowCreate(!showCreate); setCreatedMeetLink(null); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground transition-colors"
              style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}>
              <Plus className="w-4 h-4" />
              New Meeting
            </button>
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl p-4 mb-4 text-sm text-red-300" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        {/* Create meeting form */}
        {showCreate && (
          <div className="rounded-xl p-5 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-sm font-medium text-foreground mb-4">Schedule a Meeting</h2>
            <div className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Meeting title"
                className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                  <div className="flex gap-2">
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white/5 border-white/10 text-foreground" />
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-white/5 border-white/10 text-foreground w-28" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">End</label>
                  <div className="flex gap-2">
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white/5 border-white/10 text-foreground" />
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-white/5 border-white/10 text-foreground w-28" />
                  </div>
                </div>
              </div>
              <Input
                value={attendeesInput}
                onChange={(e) => setAttendeesInput(e.target.value)}
                placeholder="Attendee emails (comma separated)"
                className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !title.trim() || !startDate || !endDate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-foreground transition-colors disabled:opacity-40"
                style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                Create with Meet Link
              </button>
            </div>

            {/* Show created link */}
            {createdMeetLink && (
              <div className="mt-4 p-3 rounded-lg flex items-center gap-3" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <Video className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-green-300 font-medium">Meet link generated!</p>
                  <p className="text-xs text-green-400/60 truncate">{createdMeetLink}</p>
                </div>
                <button onClick={() => copyLink(createdMeetLink)} className="p-2 rounded-lg text-green-400 hover:bg-green-400/10">
                  <Copy className="w-4 h-4" />
                </button>
                <a href={createdMeetLink} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-green-400 hover:bg-green-400/10">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Upcoming events */}
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Upcoming Meetings</h2>
        {loading && !hasLoaded ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        ) : events.length === 0 && hasLoaded ? (
          <div className="text-center py-16">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No upcoming meetings</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-xl p-4 group"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{event.summary}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatEventTime(event.start)} — {formatEventTime(event.end)}
                    </p>
                    {event.attendees.length> 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {event.attendees.length} attendee{event.attendees.length> 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {event.meetLink && (
                      <>
                        <button onClick={() => copyLink(event.meetLink!)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors" title="Copy Meet link">
                          <Copy className="w-4 h-4" />
                        </button>
                        <a href={event.meetLink} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors" title="Join meeting">
                          <Video className="w-4 h-4" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
