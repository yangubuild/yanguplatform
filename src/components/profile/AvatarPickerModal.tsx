import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { YANGU_EMOJIS, getEmojiAvatarUrl } from "@/lib/avatarUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmojiPreloader } from "@/hooks/useEmojiPreloader";

interface AvatarPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AvatarPickerModal({ open, onOpenChange }: AvatarPickerModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadedKeys } = useEmojiPreloader();

  const currentEmojiKey = profile?.avatar_mode === "emoji" ? (profile as any).avatar_emoji_key : null;

  const handleSelectEmoji = async (key: string) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_mode: "emoji",
          avatar_emoji_key: key,
        } as any)
        .eq("id", user.id);

      if (error) throw error;
      await refreshProfile();
      toast({ title: "Avatar updated!" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Failed to update avatar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB allowed.", variant: "destructive" });
      return;
    }

    const img = new Image();
    img.onload = () => {
      if (img.width > 512 || img.height > 512) {
        toast({
          title: "Tip: Recommended size",
          description: "For best results, use a 512×512px image. Yours will be cropped to a circle.",
        });
      }
    };
    img.src = URL.createObjectURL(file);

    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      toast({ title: "Invalid file type", description: "PNG, JPEG, WEBP, or GIF only.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-media")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("profile-media")
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_mode: "upload",
          avatar_url: publicUrl.publicUrl,
          avatar_emoji_key: null,
        } as any)
        .eq("id", user.id);

      if (updateError) throw updateError;
      await refreshProfile();
      toast({ title: "Avatar uploaded!" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Change profile picture</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="emoji" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="emoji">YANGU Emojis</TabsTrigger>
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
          </TabsList>

          <TabsContent value="emoji" className="mt-4">
            {saving && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!saving && (
              <div className="grid grid-cols-5 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {YANGU_EMOJIS.map((emoji) => {
                  const isLoaded = loadedKeys.has(emoji.key);
                  return (
                    <button
                      key={emoji.key}
                      onClick={() => handleSelectEmoji(emoji.key)}
                      className={cn(
                        "relative rounded-xl overflow-hidden transition-all hover:scale-105 focus:outline-none",
                        "w-full aspect-square",
                        currentEmojiKey === emoji.key
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                          : "hover:ring-1 hover:ring-muted-foreground/30"
                      )}
                      title={emoji.label}
                    >
                      {/* Skeleton placeholder */}
                      {!isLoaded && (
                        <div className="absolute inset-0 animate-pulse rounded-xl bg-muted" />
                      )}
                      <img
                        src={getEmojiAvatarUrl(emoji.key)}
                        alt={emoji.label}
                        width={64}
                        height={64}
                        className={cn(
                          "w-full h-full object-cover transition-opacity duration-200",
                          isLoaded ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <div className="flex flex-col items-center gap-4 py-8">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                PNG, JPEG, WEBP or GIF · Max 2MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleUpload}
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
