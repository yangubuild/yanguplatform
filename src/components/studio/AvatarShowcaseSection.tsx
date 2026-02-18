import { ChevronRight } from "lucide-react";

interface AvatarSlot {
  id: string;
  video?: string;
}

const AVATAR_SLOTS: AvatarSlot[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  // videos will be added later
}));

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

      {/* top row */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
        {AVATAR_SLOTS.slice(0, 6).map((slot) => (
          <div
            key={slot.id}
            className="relative rounded-xl overflow-hidden aspect-[3/4] bg-muted/30 border border-border/20 cursor-pointer group"
          >
            {slot.video ? (
              <video
                src={slot.video}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                loop
                playsInline
                autoPlay
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-muted/40 to-muted/10" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
        ))}
      </div>

      {/* bottom row */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
        {AVATAR_SLOTS.slice(6, 12).map((slot) => (
          <div
            key={slot.id}
            className="relative rounded-xl overflow-hidden aspect-[3/4] bg-muted/30 border border-border/20 cursor-pointer group"
          >
            {slot.video ? (
              <video
                src={slot.video}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                loop
                playsInline
                autoPlay
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-muted/40 to-muted/10" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
        ))}
      </div>

      {/* CTA button */}
      <div className="flex justify-center pt-2">
        <button className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors">
          Create <span className="font-semibold">Avatar Video</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
