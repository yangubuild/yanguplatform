import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type AppRole = "admin" | "user";

interface RolesState {
  roles: AppRole[];
  isAdmin: boolean;
  isOwner: boolean; // For Phase 1: isOwner = isAdmin
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage user roles from the database.
 * Uses the `has_role` RPC to check for admin role.
 * For Phase 1: isOwner is derived as isOwner = isAdmin
 */
export function useRoles(): RolesState {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!user?.id) {
      setRoles([]);
      setIsLoading(false);
      return;
    }

    try {
      // Check if user has admin role
      const { data: hasAdmin, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (error) {
        console.error("Error fetching roles:", error);
        setRoles(["user"]); // Default to user role on error
      } else {
        // Build roles array - user always has 'user' role, may also have 'admin'
        const userRoles: AppRole[] = ["user"];
        if (hasAdmin) {
          userRoles.push("admin");
        }
        setRoles(userRoles);
      }
    } catch (err) {
      console.error("Failed to fetch roles:", err);
      setRoles(["user"]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // Only fetch roles after auth is loaded and user is authenticated
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setRoles([]);
      setIsLoading(false);
      return;
    }

    fetchRoles();
  }, [authLoading, isAuthenticated, fetchRoles]);

  const isAdmin = roles.includes("admin");
  // Phase 1: Owner = Admin
  const isOwner = isAdmin;

  return {
    roles,
    isAdmin,
    isOwner,
    isLoading: authLoading || isLoading,
    refetch: fetchRoles,
  };
}
