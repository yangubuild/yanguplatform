import { useState, useRef } from "react";
import { Camera, Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  groupId: string;
  currentUrl: string | null;
  groupName: string;
  size?: number;
  editable?: boolean;
}

export function GroupAvatarUpload({ groupId, currentUrl, groupName, size = 40, editable = false }: Props) {
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const qc = useQueryClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size> 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `group-avatars/${groupId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("post-media").getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("chat_groups")
        .update({ avatar_url: avatarUrl } as any)
        .eq("id", groupId);
      if (updateError) throw updateError;

      qc.invalidateQueries({ queryKey: ["my-groups"] });
      qc.invalidateQueries({ queryKey: ["active-group-thread", groupId] });
      setImgError(false);
      toast.success("Group avatar updated");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const showImage = currentUrl && !imgError;

  return (
    <div className="relative group/avatar" style={{ width: size, height: size }}>
      <div
        className="rounded-full flex items-center justify-center overflow-hidden"
        style={{
          width: size,
          height: size,
          background: "rgba(168,85,247,0.2)",
          color: "rgba(168,85,247,0.9)",
          fontSize: size * 0.3,
          fontWeight: 700 }}>
        {uploading ? (
          <Loader2 className="animate-spin" style={{ width: size * 0.4, height: size * 0.4 }} />
        ) : showImage ? (
          <img
            src={currentUrl}
            alt={groupName}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Users style={{ width: size * 0.4, height: size * 0.4 }} />
        )}
      </div>
      {editable && !uploading && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.5)" }}>
            <Camera className="w-4 h-4 text-foreground" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </>
      )}
    </div>
  );
}
