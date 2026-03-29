/**
 * YANGU Social Media — Library Service
 * Handles library asset imports, uploads, and metadata extraction.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  SocialLibraryItem,
  ImportLibraryInput,
  LibraryItemType,
  LibraryItemStatus,
} from "@/types/socialMedia";

export const libraryService = {
  /** List all library items for the current user */
  async listItems(
    userId: string,
    filters?: {
      item_type?: LibraryItemType;
      status?: LibraryItemStatus;
      search?: string;
    }
  ): Promise<SocialLibraryItem[]> {
    // Library table doesn't exist yet; will be created in migration
    // For now return empty array
    return [];
  },

  /** Import a new library item */
  async importItem(
    userId: string,
    workspaceId: string,
    input: ImportLibraryInput
  ): Promise<SocialLibraryItem> {
    // Scaffold: will insert into social_library_items when table exists
    const item: SocialLibraryItem = {
      id: crypto.randomUUID(),
      workspace_id: workspaceId,
      user_id: userId,
      item_type: input.item_type,
      title: input.title,
      description: input.description || null,
      file_url: input.file_url || null,
      thumbnail_url: null,
      source_url: input.source_url || null,
      extracted_text: null,
      extracted_metadata: null,
      tags: input.tags || [],
      status: "pending",
      processing_error: null,
      metadata: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return item;
  },

  /** Delete a library item */
  async deleteItem(itemId: string): Promise<void> {
    // Will delete from social_library_items when table exists
  },

  /** Upload a file to storage and create library item */
  async uploadFile(
    userId: string,
    workspaceId: string,
    file: File,
    itemType: LibraryItemType
  ): Promise<SocialLibraryItem> {
    const path = `social-library/${workspaceId}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage
      .from("social-assets")
      .upload(path, file);

    if (uploadErr) throw uploadErr;

    const {
      data: { publicUrl },
    } = supabase.storage.from("social-assets").getPublicUrl(path);

    return this.importItem(userId, workspaceId, {
      item_type: itemType,
      title: file.name,
      file_url: publicUrl,
    });
  },

  /** Extract content from a website URL (scaffold for AI pipeline) */
  async importWebsite(
    userId: string,
    workspaceId: string,
    url: string
  ): Promise<SocialLibraryItem> {
    return this.importItem(userId, workspaceId, {
      item_type: "website_import",
      title: url,
      source_url: url,
    });
  },
};
