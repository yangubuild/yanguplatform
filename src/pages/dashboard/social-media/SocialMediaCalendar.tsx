import { useState, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MoreVertical,
  Shuffle,
  SkipForward,
  Settings,
  Eye,
  EyeOff,
  Globe,
} from "lucide-react";
import { useSocialCalendar } from "@/hooks/social/useSocialCalendar";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
  isSameDay,
  isSameMonth,
  getDay,
  setHours,
} from "date-fns";
import type { SocialPost, PostStatus } from "@/types/socialMedia";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week";

const STATUS_COLORS: Record<PostStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  ready: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  scheduled: "bg-accent/15 text-accent border-accent/30",
  publishing: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  published: "bg-green-500/15 text-green-400 border-green-500/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  archived: "bg-muted text-muted-foreground border-border",
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SocialMediaCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [showDrafts, setShowDrafts] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

  // Compute date range based on view
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (viewMode === "month") {
      const ms = startOfMonth(currentDate);
      const me = endOfMonth(currentDate);
      return {
        rangeStart: format(startOfWeek(ms), "yyyy-MM-dd"),
        rangeEnd: format(endOfWeek(me), "yyyy-MM-dd"),
      };
    }
    const ws = startOfWeek(currentDate);
    const we = endOfWeek(currentDate);
    return {
      rangeStart: format(ws, "yyyy-MM-dd"),
      rangeEnd: format(we, "yyyy-MM-dd"),
    };
  }, [currentDate, viewMode]);

  const { posts, isLoading } = useSocialCalendar(rangeStart, rangeEnd, showDrafts);

  const tz = useMemo(() => {
    try {
      const o = new Date().getTimezoneOffset();
      const sign = o <= 0 ? "+" : "-";
      const h = Math.floor(Math.abs(o) / 60);
      return `GMT${sign}${h}`;
    } catch {
      return "GMT";
    }
  }, []);

  // Navigation
  const goToday = () => setCurrentDate(new Date());
  const goPrev = () =>
    setCurrentDate((d) => (viewMode === "month" ? subMonths(d, 1) : subWeeks(d, 1)));
  const goNext = () =>
    setCurrentDate((d) => (viewMode === "month" ? addMonths(d, 1) : addWeeks(d, 1)));

  // Posts by day key
  const postsByDay = useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    for (const post of posts) {
      if (!post.scheduled_for) continue;
      const key = format(new Date(post.scheduled_for), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(post);
    }
    return map;
  }, [posts]);

  // Month grid days (6 weeks)
  const monthDays = useMemo(() => {
    const ms = startOfMonth(currentDate);
    const me = endOfMonth(currentDate);
    return eachDayOfInterval({ start: startOfWeek(ms), end: endOfWeek(me) });
  }, [currentDate]);

  // Week days
  const weekDays = useMemo(() => {
    const ws = startOfWeek(currentDate);
    const we = endOfWeek(currentDate);
    return eachDayOfInterval({ start: ws, end: we });
  }, [currentDate]);

  const headerLabel =
    viewMode === "month"
      ? format(currentDate, "MMM yyyy")
      : `${format(weekDays[0], "MMM d")} – ${format(weekDays[6], "MMM d, yyyy")}`;

  return (
    <div className="flex flex-col h-full">
      {/* ─── Toolbar ─── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <Button variant="outline" size="sm" onClick={goToday} className="text-xs">
            Today
          </Button>
          <button
            onClick={goNext}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <h2 className="text-base font-semibold text-foreground ml-2">{headerLabel}</h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Globe className="h-3 w-3" /> {tz}
          </span>

          {/* Month / Week toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden ml-2">
            {(["month", "week"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={cn(
                  "px-3 py-1 text-xs font-medium capitalize transition-colors",
                  viewMode === m
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Show Drafts */}
          <Button
            variant={showDrafts ? "secondary" : "outline"}
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => setShowDrafts((v) => !v)}
          >
            {showDrafts ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            Show Drafts
          </Button>

          {/* Overflow */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2 text-xs">
                <Shuffle className="h-3.5 w-3.5" /> Shuffle Queue
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-xs">
                <SkipForward className="h-3.5 w-3.5" /> Add Skip Time
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-xs">
                <Settings className="h-3.5 w-3.5" /> Manage Schedule
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-sm text-muted-foreground">Loading calendar…</div>
          </div>
        ) : viewMode === "month" ? (
          <MonthView
            days={monthDays}
            currentDate={currentDate}
            postsByDay={postsByDay}
            onSelect={setSelectedPost}
          />
        ) : (
          <WeekView
            days={weekDays}
            postsByDay={postsByDay}
            onSelect={setSelectedPost}
          />
        )}
      </div>

      {/* ─── Post detail sheet ─── */}
      {selectedPost && (
        <div className="border-t border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">
              {selectedPost.status === "draft" ? "Draft" : "Scheduled Post"}
            </h3>
            <button
              onClick={() => setSelectedPost(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <p className="text-sm text-foreground mb-1 line-clamp-3">
            {selectedPost.caption || "No caption"}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {selectedPost.scheduled_for && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(selectedPost.scheduled_for), "MMM d, yyyy 'at' h:mm a")}
              </span>
            )}
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium border",
                STATUS_COLORS[selectedPost.status] || STATUS_COLORS.draft
              )}
            >
              {selectedPost.status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Month View ─── */
function MonthView({
  days,
  currentDate,
  postsByDay,
  onSelect,
}: {
  days: Date[];
  currentDate: Date;
  postsByDay: Map<string, SocialPost[]>;
  onSelect: (p: SocialPost) => void;
}) {
  return (
    <div className="grid grid-cols-7 h-full">
      {/* Header */}
      {DAY_NAMES.map((d) => (
        <div
          key={d}
          className="text-center text-[11px] font-semibold uppercase text-muted-foreground py-2 border-b border-border bg-card/40"
        >
          {d}
        </div>
      ))}
      {/* Cells */}
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const dayPosts = postsByDay.get(key) || [];
        const inMonth = isSameMonth(day, currentDate);
        const today = isToday(day);

        return (
          <div
            key={key}
            className={cn(
              "min-h-[100px] border-b border-r border-border p-1.5 transition-colors",
              !inMonth && "bg-muted/10",
              today && "bg-accent/5"
            )}
          >
            <div
              className={cn(
                "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                today
                  ? "bg-accent text-accent-foreground font-bold"
                  : inMonth
                  ? "text-foreground"
                  : "text-muted-foreground/50"
              )}
            >
              {format(day, "d")}
            </div>
            <div className="space-y-0.5">
              {dayPosts.slice(0, 3).map((p) => (
                <EventChip key={p.id} post={p} onClick={() => onSelect(p)} />
              ))}
              {dayPosts.length > 3 && (
                <div className="text-[10px] text-muted-foreground px-1">
                  +{dayPosts.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Week View ─── */
function WeekView({
  days,
  postsByDay,
  onSelect,
}: {
  days: Date[];
  postsByDay: Map<string, SocialPost[]>;
  onSelect: (p: SocialPost) => void;
}) {
  return (
    <div className="flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-card/40 sticky top-0 z-10">
        <div />
        {days.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className="text-center py-2 border-l border-border"
            >
              <div className="text-[10px] uppercase text-muted-foreground font-semibold">
                {format(day, "EEE")}
              </div>
              <div
                className={cn(
                  "text-lg font-semibold mx-auto w-8 h-8 flex items-center justify-center rounded-full",
                  today ? "bg-accent text-accent-foreground" : "text-foreground"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hour rows */}
      <div className="flex-1 overflow-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[48px]">
            <div className="text-[10px] text-muted-foreground text-right pr-2 pt-1 border-r border-border">
              {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
            </div>
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayPosts = postsByDay.get(key) || [];
              const hourPosts = dayPosts.filter((p) => {
                if (!p.scheduled_for) return false;
                return new Date(p.scheduled_for).getHours() === hour;
              });
              return (
                <div
                  key={`${key}-${hour}`}
                  className="border-l border-b border-border p-0.5 relative"
                >
                  {hourPosts.map((p) => (
                    <EventChip key={p.id} post={p} onClick={() => onSelect(p)} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Event Chip ─── */
function EventChip({ post, onClick }: { post: SocialPost; onClick: () => void }) {
  const colorClass = STATUS_COLORS[post.status] || STATUS_COLORS.draft;
  const time = post.scheduled_for
    ? format(new Date(post.scheduled_for), "h:mm a")
    : "";
  const label = post.caption?.slice(0, 24) || "Post";

  return (
    <button
      onClick={onClick}
      className={cn(
        "block w-full text-left text-[10px] font-medium rounded px-1.5 py-0.5 truncate border transition-colors hover:opacity-80",
        colorClass
      )}
    >
      {time && <span className="mr-1">{time}</span>}
      {label}
    </button>
  );
}
