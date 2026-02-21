/**
 * Registry-Driven Widget Resolution
 *
 * Queries developer_surface_installs joined with developer_widget_registry
 * to determine which widgets are available on a given surface.
 *
 * No schema assumptions — uses only existing fields.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ResolvedWidget {
  widget_key: string;
  title: string | null;
  description: string | null;
  iframe_url: string | null;
}

/**
 * Returns the list of enabled, installed widgets for a surface.
 *
 * Join path:
 *   developer_surface_installs (surface_id, widget_key, status)
 *   → developer_widget_registry (widget_key, is_enabled, title)
 *
 * Both tables must agree: install status IN (active, enabled) AND registry is_enabled = true.
 */
export async function getEnabledWidgetsForSurface(
  surfaceId: string
): Promise<ResolvedWidget[]> {
  if (!surfaceId) return [];

  // 1. Get active installs for this surface
  const { data: installs, error: installErr } = await supabase
    .from("developer_surface_installs")
    .select("widget_key")
    .eq("surface_id", surfaceId)
    .in("status", ["active", "enabled"]);

  if (installErr || !installs || installs.length === 0) return [];

  const installedKeys = installs.map((i) => i.widget_key);

  // 2. Cross-reference with registry (only enabled widgets)
  const { data: widgets, error: regErr } = await supabase
    .from("developer_widget_registry")
    .select("widget_key, title, description, iframe_url")
    .in("widget_key", installedKeys)
    .eq("is_enabled", true);

  if (regErr || !widgets) return [];

  return widgets.map((w) => ({
    widget_key: w.widget_key,
    title: w.title ?? null,
    description: w.description ?? null,
    iframe_url: w.iframe_url ?? null,
  }));
}

/**
 * Check if a specific widget_key is available (installed + enabled) on a surface.
 */
export async function isWidgetAvailable(
  surfaceId: string,
  widgetKey: string
): Promise<boolean> {
  if (!surfaceId || !widgetKey) return false;
  const widgets = await getEnabledWidgetsForSurface(surfaceId);
  return widgets.some((w) => w.widget_key === widgetKey);
}
