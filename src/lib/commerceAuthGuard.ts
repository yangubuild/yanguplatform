/**
 * Commerce Auth Guard — wraps commerce actions to require authentication.
 * Logged-out users are redirected to /auth/login.
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Run a commerce action only if the user is logged in.
 * If not logged in, redirect to auth with a return path.
 */
export async function requireAuthForAction(
  action: () => void | Promise<void>,
  navigate: (path: string) => void,
  returnTo?: string,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const returnPath = returnTo || window.location.pathname;
    navigate(`/auth/login?redirect=${encodeURIComponent(returnPath)}`);
    return;
  }
  await action();
}
