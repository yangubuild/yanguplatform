import { supabase } from "@/integrations/supabase/client";

/** Resolve the current user's active org id (owner or membership).
 *  Falls back to null when the user has no org yet — callers must handle that. */
export async function getActiveOrgId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: mem } = await supabase
    .from("org_memberships")
    .select("org_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (mem?.org_id) return mem.org_id;
  const { data: own } = await supabase
    .from("orgs")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return own?.id ?? null;
}

export async function requireOrgId(): Promise<string> {
  const id = await getActiveOrgId();
  if (!id) throw new Error("No active organization for current user");
  return id;
}

export async function currentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}