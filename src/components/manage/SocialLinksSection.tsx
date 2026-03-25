import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Globe } from "lucide-react";

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/youragency" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@youragency" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/youragency" },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/youragency" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/youragency" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@youragency" },
  { key: "whatsapp", label: "WhatsApp Business", placeholder: "https://wa.me/1234567890" },
];

type SocialLink = { url: string; visible: boolean };
type SocialLinks = Record<string, SocialLink>;

interface SocialLinksSectionProps {
  agencyId: string;
  metadata: any;
  canEdit: boolean;
}

export function SocialLinksSection({ agencyId, metadata, canEdit }: SocialLinksSectionProps) {
  const saved: SocialLinks = metadata?.social_links ?? {};
  const [links, setLinks] = useState<SocialLinks>(() => {
    const initial: SocialLinks = {};
    for (const p of SOCIAL_PLATFORMS) {
      initial[p.key] = saved[p.key] ?? { url: "", visible: true };
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const newMeta = { ...(metadata ?? {}), social_links: links };
      const { error } = await supabase
        .from("agencies")
        .update({ metadata: newMeta })
        .eq("id", agencyId);
      if (error) throw error;
      toast.success("Social links saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4" /> Social Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Add your agency's social media profiles. These can be displayed on your agency profile.
        </p>
        {SOCIAL_PLATFORMS.map((p) => (
          <div key={p.key} className="flex items-center gap-3">
            <label className="text-sm text-foreground w-28 shrink-0">{p.label}</label>
            <Input
              value={links[p.key]?.url ?? ""}
              onChange={(e) =>
                setLinks((prev) => ({
                  ...prev,
                  [p.key]: { ...prev[p.key], url: e.target.value },
                }))
              }
              placeholder={p.placeholder}
              className="h-8 text-sm flex-1"
              disabled={!canEdit}
            />
            <Switch
              checked={links[p.key]?.visible ?? true}
              onCheckedChange={(v) =>
                setLinks((prev) => ({
                  ...prev,
                  [p.key]: { ...prev[p.key], visible: v },
                }))
              }
              disabled={!canEdit}
            />
          </div>
        ))}
        {canEdit && (
          <Button onClick={handleSave} disabled={saving} size="sm" className="mt-2">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Social Links
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
