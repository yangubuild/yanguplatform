import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

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

export function useSurfaces() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["surfaces", user?.id],
    queryFn: async (): Promise<SurfaceWithDomain[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("public_surfaces")
        .select(`
          id,
          title,
          slug,
          description,
          is_published,
          is_featured,
          custom_domain,
          created_at,
          updated_at,
          surface_domains!inner (
            id,
            domain,
            label,
            surface_type
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching surfaces:", error);
        throw error;
      }

      // Transform the response to flatten the domain relationship
      return (data || []).map((surface) => ({
        id: surface.id,
        title: surface.title,
        slug: surface.slug,
        description: surface.description,
        is_published: surface.is_published,
        is_featured: surface.is_featured,
        custom_domain: surface.custom_domain,
        created_at: surface.created_at,
        updated_at: surface.updated_at,
        domain: {
          id: surface.surface_domains.id,
          domain: surface.surface_domains.domain,
          label: surface.surface_domains.label,
          surface_type: surface.surface_domains.surface_type,
        },
      }));
    },
    enabled: isAuthenticated && !!user,
  });
}
