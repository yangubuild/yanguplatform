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

      // Get user's org memberships first
      const { data: memberships, error: membershipError } = await supabase
        .from("org_memberships")
        .select("org_id")
        .eq("user_id", user.id);

      if (membershipError) {
        console.error("Error fetching memberships:", membershipError);
        throw membershipError;
      }

      if (!memberships || memberships.length === 0) {
        return [];
      }

      const orgIds = memberships.map((m) => m.org_id);

      // Fetch surfaces for user's orgs
      let query = supabase
        .from("surfaces")
        .select("id, title, surface_type, status, org_id, archived_at, created_at, draft_slug, draft_domain_id")
        .in("org_id", orgIds)
        .order("created_at", { ascending: false });

      // Filter archived unless showing them
      if (!showArchived) {
        query = query.is("archived_at", null);
      }

      const { data: surfaces, error: surfacesError } = await query;

      if (surfacesError) {
        console.error("Error fetching surfaces:", surfacesError);
        throw surfacesError;
      }

      if (!surfaces || surfaces.length === 0) {
        return [];
      }

      // Fetch active publishes for all surfaces
      const surfaceIds = surfaces.map((s) => s.id);
      const { data: publishes, error: publishesError } = await supabase
        .from("surface_publishes")
        .select(`
          id,
          surface_id,
          domain_id,
          slug,
          published_at,
          domains!surface_publishes_domain_id_fkey (
            host,
            domain_type
          )
        `)
        .in("surface_id", surfaceIds)
        .eq("state", "published")
        .is("unpublished_at", null);

      if (publishesError) {
        console.error("Error fetching publishes:", publishesError);
        // Continue without publish info rather than failing
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

      return surfaces.map((surface) => ({
        id: surface.id,
        title: surface.title,
        surface_type: surface.surface_type,
        status: surface.status,
        org_id: surface.org_id,
        archived_at: surface.archived_at,
        created_at: surface.created_at,
        draft_slug: (surface as any).draft_slug || null,
        draft_domain_id: (surface as any).draft_domain_id || null,
        activePublishes: publishesBySurface[surface.id] || [],
      }));
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
