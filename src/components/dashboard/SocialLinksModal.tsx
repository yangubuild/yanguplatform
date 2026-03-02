import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import instagramIcon from "@/assets/icons/instagram-2.png";
import facebookIcon from "@/assets/icons/facebook-2.png";
import youtubeIcon from "@/assets/icons/youtube-2.png";
import linkedinIcon from "@/assets/icons/linkedin.png";
import xIcon from "@/assets/icons/x-2.png";
import tiktokIcon from "@/assets/icons/tiktok-2.png";
import whatsappIcon from "@/assets/icons/whatsapp-2.png";

const SOCIAL_PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: instagramIcon, placeholder: "Enter Instagram username or URL" },
  { id: "facebook", name: "Facebook", icon: facebookIcon, placeholder: "Enter Facebook page URL" },
  { id: "youtube", name: "YouTube", icon: youtubeIcon, placeholder: "Enter YouTube channel URL" },
  { id: "linkedin", name: "LinkedIn", icon: linkedinIcon, placeholder: "Enter LinkedIn profile URL" },
  { id: "x", name: "X", icon: xIcon, placeholder: "Enter X username" },
  { id: "tiktok", name: "TikTok", icon: tiktokIcon, placeholder: "Enter TikTok username or URL" },
  { id: "whatsapp", name: "WhatsApp", icon: whatsappIcon, placeholder: "Enter WhatsApp number" },
] as const;

export type SocialLinksData = Record<string, string | null>;

interface SocialLinksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: SocialLinksData;
  onSave: (data: SocialLinksData) => void;
  saving?: boolean;
}

export function SocialLinksModal({ open, onOpenChange, initialData, onSave, saving }: SocialLinksModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const init: Record<string, string> = {};
      SOCIAL_PLATFORMS.forEach(p => {
        init[p.id] = initialData?.[p.id] ?? "";
      });
      setValues(init);
    }
  }, [open, initialData]);

  const handleSave = () => {
    const normalized: SocialLinksData = {};
    SOCIAL_PLATFORMS.forEach(p => {
      const v = values[p.id]?.trim();
      normalized[p.id] = v || null;
    });
    onSave(normalized);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
        <DialogHeader>
          <DialogTitle className="text-white">Social icons</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2 max-h-[60vh] overflow-y-auto">
          {SOCIAL_PLATFORMS.map(platform => (
            <div key={platform.id} className="flex items-center gap-3">
              <img
                src={platform.icon}
                alt={platform.name}
                className="w-8 h-8 rounded-lg shrink-0 object-contain"
              />
              <Input
                value={values[platform.id] || ""}
                onChange={e => setValues(prev => ({ ...prev, [platform.id]: e.target.value }))}
                placeholder={platform.placeholder}
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
              />
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ background: "#E67E22" }}
            className="text-white hover:opacity-90"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Helper: get platform icons for display */
export { SOCIAL_PLATFORMS };
