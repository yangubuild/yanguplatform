/**
 * React hook for IntersectionObserver-based impression tracking.
 * Fires once per entity per session to avoid duplicate counts.
 */

import { useEffect, useRef, useCallback } from "react";
import { trackImpressions, trackClick, type ExploreSurface } from "@/lib/exploreAnalytics";

interface TrackableEntity {
  id: string;
  visibility_tier?: string;
  trust_score?: number | null;
}

const trackedImpressions = new Set<string>();

/**
 * Returns a ref to attach to a container. When the container enters
 * the viewport, it fires impression events for all provided entities.
 */
export function useImpressionTracker(
  entities: TrackableEntity[],
  surface: DiscoverySurface,
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || entities.length === 0) return;

    const key = `${surface}_${entities.map(e => e.id).join(",")}`;
    if (trackedImpressions.has(key)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackedImpressions.add(key);
          trackImpressions(entities, surface);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [entities, surface]);

  const handleClick = useCallback(
    (entity: TrackableEntity) => {
      trackClick(entity, surface);
    },
    [surface],
  );

  return { ref, handleClick };
}
