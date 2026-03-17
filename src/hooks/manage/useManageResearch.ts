import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResearchOverview {
  total_builder_events: number;
  total_publishes: number;
  published_count: number;
  draft_count: number;
  recent_events: {
    id: string;
    event_type: string;
    publish_id: string;
    created_at: string;
    visitor_id: string | null;
  }[];
  recent_publishes: {
    id: string;
    slug: string;
    state: string;
    published_at: string | null;
    created_at: string;
  }[];
}

export function useManageResearch() {
  return useQuery({
    queryKey: ["manage", "research"],
    queryFn: async () => {
      // Builder events — recent 50
      const { data: events, error: evErr } = await supabase
        .from("builder_events")
        .select("id, event_type, publish_id, created_at, visitor_id")
        .order("created_at", { ascending: false })
        .limit(50);
      if (evErr) throw evErr;

      // Builder publishes
      const { data: publishes, error: pubErr } = await supabase
        .from("builder_publishes")
        .select("id, slug, state, published_at, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (pubErr) throw pubErr;

      const pubs = publishes ?? [];

      return {
        total_builder_events: events?.length ?? 0,
        total_publishes: pubs.length,
        published_count: pubs.filter((p) => p.state === "published").length,
        draft_count: pubs.filter((p) => p.state === "draft").length,
        recent_events: events ?? [],
        recent_publishes: pubs,
      } as ResearchOverview;
    },
    staleTime: 30_000,
    retry: 1,
  });
}
