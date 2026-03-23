import { supabase } from "@/integrations/supabase/client";

type ChatAttachmentKind = "image" | "video" | "audio" | "document";

interface UploadChatAttachmentOptions {
  userId: string;
  file: File;
  prefix: string;
}

export async function uploadChatAttachment({ userId, file, prefix }: UploadChatAttachmentOptions) {
  const ext = file.name.split(".").pop() || file.type.split("/")[1] || "bin";
  const baseName = (file.name.replace(/\.[^.]+$/, "") || prefix)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "") || prefix;
  const path = `${userId}/${prefix}-${Date.now()}-${baseName}.${ext}`;

  const { error } = await supabase.storage.from("post-media").upload(path, file);
  if (error) throw error;

  return supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
}

export function buildChatAttachmentMessage(kind: ChatAttachmentKind, url: string, fileName?: string) {
  switch (kind) {
    case "image":
      return `📷 ${url}`;
    case "video":
      return `🎥 ${url}`;
    case "audio":
      return `🎵 ${url}`;
    case "document":
      return `📎 ${fileName || "File"}\n${url}`;
  }
}