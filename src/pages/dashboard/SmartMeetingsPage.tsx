// SMART MEETINGS — top-level Yangu product. Functionality is not built yet, so
// this is an honest branded preparation state (no fake controls, no fake data).

import { CalendarClock } from "lucide-react";
import { YanguGlowBall } from "@/components/brand/YanguGlowBall";

const PLANNED = [
  "Meeting & pendant recording",
  "Uploaded recordings",
  "Transcription & translation",
  "Summaries, minutes & action items",
  "Automatic follow-ups",
];

export default function SmartMeetingsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-12 text-center sm:px-6">
      <div className="flex justify-center">
        <YanguGlowBall state="idle" size={92} />
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-foreground sm:text-3xl">Smart Meetings</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        Yangu is preparing Smart Meetings. Nothing here is active yet — you will see it in this
        section the moment it goes live.
      </p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarClock className="h-4 w-4" /> In preparation
        </div>
        <ul className="mt-3 space-y-2">
          {PLANNED.map((item) => (
            <li key={item} className="text-sm text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
