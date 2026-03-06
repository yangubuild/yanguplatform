// YANGU App Store — Data access helpers
import { supabase } from "@/integrations/supabase/client";
import type { AppRegistryEntry, AppCategory, AppUserInstall, AppInstallState } from "./types";

/** Fetch all active, public apps */
export async function fetchApps() {
  const { data, error } = await supabase
    .from("app_registry")
    .select("*")
    .eq("status", "active")
    .eq("visibility", "public")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as unknown as AppRegistryEntry[];
}

/** Fetch apps by category slug */
export async function fetchAppsByCategory(category: string) {
  const { data, error } = await supabase
    .from("app_registry")
    .select("*")
    .eq("status", "active")
    .eq("visibility", "public")
    .eq("category", category)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as unknown as AppRegistryEntry[];
}

/** Fetch featured apps */
export async function fetchFeaturedApps() {
  const { data, error } = await supabase
    .from("app_registry")
    .select("*")
    .eq("status", "active")
    .eq("is_featured", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as unknown as AppRegistryEntry[];
}

/** Fetch single app by slug */
export async function fetchAppBySlug(slug: string) {
  const { data, error } = await supabase
    .from("app_registry")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data as unknown as AppRegistryEntry;
}

/** Fetch all categories */
export async function fetchCategories() {
  const { data, error } = await supabase
    .from("app_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as unknown as AppCategory[];
}

/** Fetch user's installed apps */
export async function fetchUserInstalls(userId: string) {
  const { data, error } = await supabase
    .from("app_user_installs")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data as unknown as AppUserInstall[];
}

/** Get install state for a specific app for a user */
export async function getUserAppState(userId: string, appId: string): Promise<AppInstallState> {
  const { data } = await supabase
    .from("app_user_installs")
    .select("status")
    .eq("user_id", userId)
    .eq("app_id", appId)
    .maybeSingle();
  return (data?.status as AppInstallState) ?? "not_installed";
}

/** Install/connect an app for a user */
export async function installApp(userId: string, appId: string, status: AppInstallState = "installed") {
  const { error } = await supabase
    .from("app_user_installs")
    .upsert({ user_id: userId, app_id: appId, status, updated_at: new Date().toISOString() }, { onConflict: "user_id,app_id" });
  if (error) throw error;
}

/** Uninstall an app for a user */
export async function uninstallApp(userId: string, appId: string) {
  const { error } = await supabase
    .from("app_user_installs")
    .delete()
    .eq("user_id", userId)
    .eq("app_id", appId);
  if (error) throw error;
}
