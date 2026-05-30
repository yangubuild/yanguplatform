import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ActivePublish {
  id: string;
  domain_id: string;
  domain_host: string;
  domain_type: string;
  slug: string | null;
  published_at: string | null;
}

export interface SurfaceWithPublishes {
  id: string;
  title: string | null;
  surface_type: string;
  status: string;
  org_id: string;
  archived_at: string | null;
  created_at: string | null;
  draft_slug: string | null;
  draft_domain_id: string | null;
  activePublishes: ActivePublish[];
  cover_image: string | null;
}

interface UseSurfacesOptions {
  showArchived?: boolean;
}

export function useSurfaces(options: UseSurfacesOptions = {}) {
  const { showArchived = false } = options;
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["surfaces", user?.id, showArchived],
    queryFn: async (): Promise<SurfaceWithPublishes[]> => {
      if (!user) return [];

      // ROOT CAUSE D FIX — query the active `builder_surfaces` table instead of
      // the legacy org-scoped `surfaces` table. The legacy table required an
      // org_memberships join, so solo users with no org silently got 0 rows.
      // `builder_surfaces` is user-scoped (user_id) and is the source of truth
      // for every modern builder engine. The `showArchived` flag is preserved
      // for API compatibility but builder_surfaces has no archived_at column.
      void showArchived;

      const { data: surfaces, error: surfacesError } = await supabase
        .from("builder_surfaces")
        .select("id, title, surface_type, org_id, created_at, slug, metadata, cover_image_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (surfacesError) {
        console.error("Error fetching surfaces:", surfacesError);
        throw surfacesError;
      }

      if (!surfaces || surfaces.length === 0) {
        return [];
      }

      // Fetch active publishes for all surfaces from builder_publishes
      const surfaceIds = surfaces.map((s) => s.id);
      const { data: publishes, error: publishesError } = await supabase
        .from("builder_publishes")
        .select(`
          id,
          surface_id,
          domain_id,
          slug,
          published_at,
          domains!builder_publishes_domain_id_fkey (
            host,
            domain_type
          )
        `)
        .in("surface_id", surfaceIds)
        .eq("state", "published");

      if (publishesError) {
        console.error("Error fetching publishes:", publishesError);
      }

      // Derive cover image directly from the row we already fetched.
      const coverBySurfaceId: Record<string, string | null> = {};
      for (const s of surfaces) {
        let cover: string | null = (s as any).cover_image_url || null;
        if (!cover) {
          const meta = (s as any).metadata as any;
          if (meta?.photos && Array.isArray(meta.photos) && meta.photos.length > 0) {
            cover = meta.photos[0];
          }
          if (!cover && meta?.ai_profile?.avatar_url) {
            cover = meta.ai_profile.avatar_url;
          }
        }
        coverBySurfaceId[s.id] = cover;
      }

      // Map publishes to surfaces
      const publishesBySurface: Record<string, ActivePublish[]> = {};
      if (publishes) {
        for (const pub of publishes) {
          const surfaceId = pub.surface_id;
          if (!publishesBySurface[surfaceId]) {
            publishesBySurface[surfaceId] = [];
          }
          publishesBySurface[surfaceId].push({
            id: pub.id,
            domain_id: pub.domain_id,
            domain_host: (pub.domains as any)?.host || "",
            domain_type: (pub.domains as any)?.domain_type || "",
            slug: pub.slug,
            published_at: pub.published_at,
          });
        }
      }

      return surfaces.map((surface) => {
        const active = publishesBySurface[surface.id] || [];
        return {
          id: surface.id,
          title: surface.title,
          surface_type: surface.surface_type,
          status: active.length > 0 ? "published" : "draft",
          org_id: (surface as any).org_id || "",
          archived_at: null,
          created_at: surface.created_at,
          draft_slug: (surface as any).slug || null,
          draft_domain_id: null,
          activePublishes: active,
          cover_image: coverBySurfaceId[surface.id] || null,
        };
      });
    },
    enabled: isAuthenticated && !!user,
  });
}

// Legacy export for backwards compatibility with existing code
export interface SurfaceWithDomain {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  is_featured: boolean;
  custom_domain: string | null;
  created_at: string;
  updated_at: string;
  domain: {
    id: string;
    domain: string;
    label: string;
    surface_type: string;
  };
}
