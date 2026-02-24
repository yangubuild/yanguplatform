import { useRef, useState, useEffect, useCallback } from "react";

interface Props {
  name: string;
  video?: string;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Style card with lazy-loaded demo video.
 * - Shows poster/thumbnail first (no autoplay on load)
 * - Loads video src only when card enters viewport
 * - Plays only on hover or selection
 * - Pauses + unloads on leave
 */
export default function LazyStyleCard({ name, video, selected, onSelect }: Props) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // IntersectionObserver – mark when card enters viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          obs.disconnect(); // only need to detect once
        }
      },
      { rootMargin: "100px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Play/pause based on hover or selection
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isHovered || selected) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
      vid.currentTime = 0;
    }
  }, [isHovered, selected]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <button
      ref={cardRef}
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group flex flex-col gap-1.5"
    >
      <div
        className={`relative aspect-square rounded-xl border-2 overflow-hidden transition-all ${
          selected
            ? "border-accent shadow-[0_0_12px_hsl(var(--accent)/0.3)]"
            : "border-border/20 hover:border-border/40"
        } bg-muted/10`}
      >
        {video && isInView ? (
          <video
            ref={videoRef}
            src={video}
            muted
            loop
            playsInline
            preload="none"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground/40 text-center px-2">
              {name}
            </span>
          </div>
        )}
        {selected && (
          <div className="absolute top-1.5 left-1.5 h-5 w-5 rounded-full bg-accent flex items-center justify-center">
            <svg
              className="h-3 w-3 text-accent-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-foreground text-center">{name}</span>
    </button>
  );
}
