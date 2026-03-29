import { useState, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useSocialPosts } from "@/hooks/social/useSocialPosts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, getDay } from "date-fns";
import type { SocialPost } from "@/types/socialMedia";

export default function SocialMediaCalendar() {
  const { posts, isLoading } = useSocialPosts("scheduled");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart); // 0=Sun

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

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-foreground">Calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-muted">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[140px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-muted">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-sm text-muted-foreground">Loading calendar…</div>
        </div>
      ) : posts.length === 0 && !selectedPost ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
            <CalendarIcon className="w-10 h-10 text-accent/60" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-2">No posts in queue</h2>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Schedule posts to automatically publish them at optimal times.
          </p>
        </div>
      ) : (
        <>
          {/* Calendar grid */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-7">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-[10px] font-bold uppercase text-muted-foreground py-2 border-b border-border">
                  {d}
                </div>
              ))}
              {/* Empty cells for offset */}
              {Array.from({ length: startDow }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-border bg-muted/20" />
              ))}
              {daysInMonth.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayPosts = postsByDay.get(key) || [];
                return (
                  <div
                    key={key}
                    className={`min-h-[80px] border-b border-r border-border p-1.5 ${isToday(day) ? "bg-accent/5" : ""}`}
                  >
                    <div className={`text-xs font-medium mb-1 ${isToday(day) ? "text-accent font-bold" : "text-muted-foreground"}`}>
                      {format(day, "d")}
                    </div>
                    {dayPosts.slice(0, 2).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPost(p)}
                        className="block w-full text-left text-[10px] font-medium text-accent bg-accent/10 rounded px-1 py-0.5 mb-0.5 truncate hover:bg-accent/20 transition-colors"
                      >
                        {format(new Date(p.scheduled_for!), "h:mm a")} — {p.caption?.slice(0, 20) || "Post"}
                      </button>
                    ))}
                    {dayPosts.length > 2 && (
                      <div className="text-[10px] text-muted-foreground px-1">+{dayPosts.length - 2} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected post detail */}
          {selectedPost && (
            <div className="mt-6 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">Scheduled Post</h3>
                <button onClick={() => setSelectedPost(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
              </div>
              <p className="text-sm text-foreground mb-2">{selectedPost.caption}</p>
              <div className="text-xs text-muted-foreground">
                {selectedPost.scheduled_for && `Scheduled: ${format(new Date(selectedPost.scheduled_for), "MMM d, yyyy 'at' h:mm a")}`}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
