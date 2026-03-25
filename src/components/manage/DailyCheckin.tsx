import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, Flame } from "lucide-react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";

interface DailyCheckinProps {
  memberId: string;
  agencyId: string;
}

export function DailyCheckin({ memberId, agencyId }: DailyCheckinProps) {
  const qc = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  // Get last 7 days of check-ins
  const { data: checkins, isLoading } = useQuery({
    queryKey: ["foot-soldier-checkins", memberId],
    queryFn: async () => {
      const sevenDaysAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("foot_soldier_checkins")
        .select("checkin_date, users_onboarded")
        .eq("member_id", memberId)
        .gte("checkin_date", sevenDaysAgo)
        .order("checkin_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Calculate streak
  const { data: allCheckins } = useQuery({
    queryKey: ["foot-soldier-streak", memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("foot_soldier_checkins")
        .select("checkin_date")
        .eq("member_id", memberId)
        .order("checkin_date", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data;
    },
  });

  const checkedInToday = checkins?.some((c) => c.checkin_date === today);

  // Calculate current streak
  let streak = 0;
  if (allCheckins?.length) {
    const dates = allCheckins.map((c) => c.checkin_date);
    let checkDate = new Date();
    // If not checked in today, start from yesterday
    if (!dates.includes(format(checkDate, "yyyy-MM-dd"))) {
      checkDate = subDays(checkDate, 1);
    }
    for (let i = 0; i < 60; i++) {
      const d = format(subDays(checkDate, i), "yyyy-MM-dd");
      if (dates.includes(d)) {
        streak++;
      } else {
        break;
      }
    }
  }

  const checkinMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("foot_soldier_checkins").insert({
        member_id: memberId,
        agency_id: agencyId,
        checkin_date: today,
        users_onboarded: 10,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["foot-soldier-checkins"] });
      qc.invalidateQueries({ queryKey: ["foot-soldier-streak"] });
      toast.success("Check-in recorded! Keep up the great work 💪");
    },
    onError: (e: any) => {
      if (e.message?.includes("duplicate") || e.message?.includes("unique")) {
        toast.info("Already checked in today!");
      } else {
        toast.error(e.message);
      }
    },
  });

  // Build last 7 days display
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const checked = checkins?.some((c) => c.checkin_date === dateStr);
    return { date, dateStr, checked, label: format(date, "EEE") };
  });

  const weekCheckins = last7Days.filter((d) => d.checked).length;

  if (isLoading) return <Skeleton className="h-40" />;

  return (
    <Card className="border-2 border-accent/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-accent" /> Daily Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Check-in button */}
        <Button
          className="w-full h-12 text-base"
          disabled={checkedInToday || checkinMut.isPending}
          onClick={() => checkinMut.mutate()}
          variant={checkedInToday ? "outline" : "default"}
        >
          {checkedInToday ? (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2 text-emerald-500" />
              ✅ Checked in today
            </>
          ) : (
            "✅ I onboarded 10+ users today"
          )}
        </Button>

        {/* Streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-foreground">Streak: {streak} day{streak !== 1 ? "s" : ""}</span>
          </div>
          <span className="text-xs text-muted-foreground">This week: {weekCheckins}/7</span>
        </div>

        {/* Last 7 days */}
        <div className="flex justify-between gap-1">
          {last7Days.map((day) => (
            <div key={day.dateStr} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{day.label}</span>
              {day.checked ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground/30" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
