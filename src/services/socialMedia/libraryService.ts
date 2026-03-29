/**
 * YANGU Social Media — Library Service
 * Handles library asset CRUD with real Supabase persistence.
 */

import { supabase } from "@/integrations/supabase/client";

export type LibrarySourceType = "upload" | "stock" | "ai_generated";
export type LibraryMediaType = "image" | "video";

export interface LibraryItem {
  id: string;
  user_id: string;
  workspace_id: string | null;
  title: string;
  file_url: string | null;
  thumbnail_url: string | null;
  source_type: LibrarySourceType;
  item_type: string;
  mime_type: string | null;
  file_size: number | null;
  metadata: Record<string, unknown> | null;
  tags: string[] | null;
  created_at: string | null;
}

export const libraryService = {
  /** List all library items for the current user */
  async listItems(
    userId: string,
    filters?: { search?: string; source_type?: LibrarySourceType }
  ): Promise<LibraryItem[]> {
    let q = supabase
      .from("social_library_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (filters?.source_type) {
      q = q.eq("source_type", filters.source_type);
    }
    if (filters?.search) {
      q = q.ilike("title", `%${filters.search}%`);
    }

    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as unknown as LibraryItem[];
  },

  /** Count items by source type */
  async countBySource(userId: string): Promise<{ upload: number; stock: number; ai_generated: number; total: number }> {
    const { count: total } = await supabase
      .from("social_library_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: uploads } = await supabase
      .from("social_library_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("source_type", "upload");

    return {
      upload: uploads || 0,
      stock: 0,
      ai_generated: 0,
      total: total || 0,
    };
  },

  /** Upload a file to storage and create library item */
  async uploadFile(
    userId: string,
    file: File,
    sourceType: LibrarySourceType = "upload"
  ): Promise<LibraryItem> {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("social-library")
      .upload(path, file);
    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = supabase.storage
      .from("social-library")
      .getPublicUrl(path);

    const itemType = file.type.startsWith("video/") ? "video" : "image";

    const { data, error } = await supabase
      .from("social_library_items")
      .insert({
        user_id: userId,
        title: file.name,
        file_url: publicUrl,
        item_type: itemType,
        source_type: sourceType,
        mime_type: file.type,
        file_size: file.size,
        status: "ready",
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as LibraryItem;
  },

  /** Save a URL (stock/AI) as a library item */
  async saveUrl(
    userId: string,
    url: string,
    title: string,
    sourceType: LibrarySourceType,
    metadata?: Record<string, unknown>
  ): Promise<LibraryItem> {
    const { data, error } = await supabase
      .from("social_library_items")
      .insert({
        user_id: userId,
        title,
        file_url: url,
        item_type: "image",
        source_type: sourceType,
        status: "ready",
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as LibraryItem;
  },

  /** Delete a library item */
  async deleteItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from("social_library_items")
      .delete()
      .eq("id", itemId);
    if (error) throw error;
  },
};
