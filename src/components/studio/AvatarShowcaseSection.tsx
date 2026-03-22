import { ChevronRight } from "lucide-react";

interface AvatarSlot {
  id: string;
  video?: string;
}

const AVATAR_SLOTS: AvatarSlot[] = [
  { id: "1", video: "/studio/avatar-1.mp4" },
  { id: "2", video: "/studio/avatar-2.mp4" },
  { id: "3", video: "/studio/avatar-3.mp4" },
  { id: "4", video: "/studio/avatar-4.mp4" },
  { id: "5", video: "/studio/avatar-5.mp4" },
  { id: "6", video: "/studio/avatar-6.mp4" },
  // row 2 – videos to be added later
  { id: "7", video: "/studio/avatar-7.mp4" },
  { id: "8", video: "/studio/avatar-8.mp4" },
  { id: "9", video: "/studio/avatar-9.mp4" },
  { id: "10", video: "/studio/avatar-10.mp4" },
  { id: "11", video: "/studio/avatar-11.mp4" },
  { id: "12", video: "/studio/avatar-12.mp4" },
];

function AvatarCard({ slot }: { slot: AvatarSlot }) {
  return (
    <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-muted/30 border border-border/20 cursor-pointer group">
      {slot.video ? (
        <video
          src={slot.video}
          className="absolute inset-0 w-full h-full object-cover"
          muted loop playsInline autoPlay
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-muted/40 to-muted/10" />
      )}

      {/* hover-reveal "Create video" button – same pattern as PVE section */}
      <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-accent/20 to-accent/5 px-2 py-1.5">
        <button className="w-full py-1.5 text-xs font-semibold text-black bg-white border border-border/40 rounded-md hover:bg-accent hover:text-foreground hover:border-accent transition-colors">
          Create video
        </button>
      </div>
    </div>
  );
}

export function AvatarShowcaseSection() {
  return (
    <div className="space-y-4">
      {/* header */}
      <div>
        <h2
          className="text-xl md:text-2xl font-black uppercase tracking-tight text-foreground flex items-center gap-2"
          style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}
        >
          AVATAR SHOWCASE
          <span className="inline-flex items-center rounded bg-accent/15 px-1.5 py-0.5 text-[11px] font-bold text-accent">
            AI
          </span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          See avatars in action and generate talking videos with AI actors.
        </p>
      </div>

      {/* row 1 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
        {AVATAR_SLOTS.slice(0, 6).map((slot) => (
          <AvatarCard key={slot.id} slot={slot} />
        ))}
      </div>

      {/* row 2 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
        {AVATAR_SLOTS.slice(6, 12).map((slot) => (
          <AvatarCard key={slot.id} slot={slot} />
        ))}
      </div>

      {/* bottom CTA */}
      <div className="flex justify-center pt-2">
        <button className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors">
          Create <span className="font-semibold">Avatar Video</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
