import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Instagram, Facebook, Youtube, Globe, Mail, Phone, Github, Linkedin } from "lucide-react";

// Full platform registry matching screenshots
const SOCIAL_PLATFORMS = [
  // Social
  { key: "instagram", label: "Instagram", placeholder: "@username", icon: Instagram, group: "Social" },
  { key: "tiktok", label: "TikTok", placeholder: "@username", icon: () => <span className="text-sm font-bold">♪</span>, group: "Social" },
  { key: "x", label: "X (Twitter)", placeholder: "@username", icon: () => <span className="text-sm font-bold">𝕏</span>, group: "Social" },
  { key: "threads", label: "Threads", placeholder: "@username", icon: () => <span className="text-sm font-bold">@</span>, group: "Social" },
  { key: "facebook", label: "Facebook", placeholder: "facebook.com/pageurl", icon: Facebook, group: "Social" },
  { key: "youtube", label: "YouTube", placeholder: "youtube.com/...", icon: Youtube, group: "Social" },
  { key: "snapchat", label: "Snapchat", placeholder: "snapchat.com/add/username", icon: () => <span className="text-sm">👻</span>, group: "Social" },
  { key: "twitch", label: "Twitch", placeholder: "@username", icon: () => <span className="text-sm font-bold">📺</span>, group: "Social" },
  { key: "discord", label: "Discord", placeholder: "discord.com/invite/channel", icon: () => <span className="text-sm">💬</span>, group: "Social" },
  { key: "pinterest", label: "Pinterest", placeholder: "pinterest.com/...", icon: () => <span className="text-sm font-bold">P</span>, group: "Social" },
  { key: "reddit", label: "Reddit", placeholder: "reddit.com/...", icon: () => <span className="text-sm">🔴</span>, group: "Social" },
  { key: "telegram", label: "Telegram", placeholder: "t.me/username", icon: () => <span className="text-sm">✈️</span>, group: "Social" },
  // Professional
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/username", icon: Linkedin, group: "Professional" },
  { key: "github", label: "GitHub", placeholder: "github.com/username", icon: Github, group: "Professional" },
  { key: "behance", label: "Behance", placeholder: "behance.net/username", icon: () => <span className="text-sm font-bold">Bē</span>, group: "Professional" },
  { key: "dribbble", label: "Dribbble", placeholder: "dribbble.com/username", icon: () => <span className="text-sm">🏀</span>, group: "Professional" },
  { key: "substack", label: "Substack", placeholder: "handle.substack.com", icon: () => <span className="text-sm">📝</span>, group: "Professional" },
  // Music
  { key: "spotify", label: "Spotify", placeholder: "open.spotify.com/artist/id", icon: () => <span className="text-sm">🎵</span>, group: "Music" },
  { key: "apple_music", label: "Apple Music", placeholder: "music.apple.com/album/...", icon: () => <span className="text-sm">🎶</span>, group: "Music" },
  { key: "tidal", label: "Tidal", placeholder: "tidal.com/browse/album/...", icon: () => <span className="text-sm">🌊</span>, group: "Music" },
  { key: "deezer", label: "Deezer", placeholder: "deezer.com/album/...", icon: () => <span className="text-sm">🎧</span>, group: "Music" },
  // Communication
  { key: "email", label: "Email", placeholder: "you@example.com", icon: Mail, group: "Contact" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "+00000000000", icon: Phone, group: "Contact" },
  { key: "phone", label: "Phone", placeholder: "+00000000000", icon: Phone, group: "Contact" },
  { key: "website", label: "Website", placeholder: "www.my-website.com", icon: Globe, group: "Contact" },
  // Special
  { key: "zillow", label: "Zillow", placeholder: "zillow.com/profile/username", icon: () => <span className="text-sm font-bold">Z</span>, group: "Special" },
  { key: "clubhouse", label: "Clubhouse", placeholder: "clubhouse.com/@profile", icon: () => <span className="text-sm">🏠</span>, group: "Special" },
] as const;

interface InfluencerLinksEditorProps {
  schema: Record<string, unknown>;
  update: (partial: Record<string, unknown>) => void;
}

export function InfluencerLinksEditor({ schema, update }: InfluencerLinksEditorProps) {
  const socialLinks = (schema.social_links as Record<string, string>) || {};
  const disabledLinks = (schema.disabled_links as string[]) || [];

  const handleLinkChange = (key: string, value: string) => {
    update({ social_links: { ...socialLinks, [key]: value } });
  };

  const handleToggle = (key: string, enabled: boolean) => {
    if (enabled) {
      update({ disabled_links: disabledLinks.filter(k => k !== key) });
    } else {
      update({ disabled_links: [...disabledLinks, key] });
    }
  };

  // Group platforms
  const groups = ["Social", "Professional", "Music", "Contact", "Special"];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Social Icons & Links</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Add links to show icons on your page</p>
      </div>
      {groups.map(group => {
        const platforms = SOCIAL_PLATFORMS.filter(p => p.group === group);
        return (
          <div key={group} className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{group}</Label>
            {platforms.map(platform => {
              const Icon = platform.icon;
              const value = socialLinks[platform.key] || "";
              const isEnabled = !disabledLinks.includes(platform.key);
              return (
                <div key={platform.key} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center shrink-0 bg-muted/50">
                    <Icon className="h-4 w-4" />
                  </div>
                  <Input
                    value={value}
                    placeholder={platform.placeholder}
                    onChange={(e) => handleLinkChange(platform.key, e.target.value)}
                    className="text-sm flex-1 h-8"
                  />
                  {value && (
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggle(platform.key, checked)}
                      className="shrink-0"
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Export platform list for preview use
export { SOCIAL_PLATFORMS };
