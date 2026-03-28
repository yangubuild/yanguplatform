/**
 * Social Platform Registry — single source of truth for all platform metadata.
 * Icons are imported as ES6 modules from src/assets/icons/.
 */

import facebookIcon from "@/assets/icons/facebook.png";
import tiktokIcon from "@/assets/icons/tiktok.png";
import instagramIcon from "@/assets/icons/instagram.png";
import snapchatIcon from "@/assets/icons/snapchat.png";
import whatsappIcon from "@/assets/icons/whatsapp.png";
import youtubeIcon from "@/assets/icons/youtube.png";
import xIcon from "@/assets/icons/x.png";
import threadsIcon from "@/assets/icons/threads.png";
import telegramIcon from "@/assets/icons/telegram.png";
import messengerIcon from "@/assets/icons/messenger.png";
import discordIcon from "@/assets/icons/discord.png";
import twitchIcon from "@/assets/icons/twitch.png";
import pinterestIcon from "@/assets/icons/pinterest.png";
import websiteIcon from "@/assets/icons/website.png";
import emailIcon from "@/assets/icons/email.png";
import phoneIcon from "@/assets/icons/phone.png";
import zillowIcon from "@/assets/icons/zillow.png";
import linkedinIcon from "@/assets/icons/linkedin.png";

export interface SocialPlatform {
  id: string;
  name: string;
  aliases: string[];
  icon: string;            // imported asset path
  placeholder: string;
  group: "social" | "professional" | "music" | "contact";
}

export const PLATFORM_REGISTRY: SocialPlatform[] = [
  // --- Default Primary 6 ---
  { id: "facebook",  name: "Facebook",    aliases: ["fb"],                      icon: facebookIcon,  placeholder: "facebook.com/page",          group: "social" },
  { id: "tiktok",    name: "TikTok",      aliases: ["tt"],                      icon: tiktokIcon,    placeholder: "@username",                  group: "social" },
  { id: "instagram", name: "Instagram",   aliases: ["ig", "insta"],             icon: instagramIcon, placeholder: "@username",                  group: "social" },
  { id: "snapchat",  name: "Snapchat",    aliases: ["snap"],                    icon: snapchatIcon,  placeholder: "snapchat.com/add/username",  group: "social" },
  { id: "whatsapp",  name: "WhatsApp",    aliases: ["wa"],                      icon: whatsappIcon,  placeholder: "+00000000000",               group: "contact" },
  { id: "youtube",   name: "YouTube",     aliases: ["yt"],                      icon: youtubeIcon,   placeholder: "youtube.com/...",             group: "social" },
  // --- Additional ---
  { id: "linkedin",  name: "LinkedIn",    aliases: ["li"],                      icon: linkedinIcon,  placeholder: "linkedin.com/in/username",   group: "professional" },
  { id: "x",         name: "X (Twitter)", aliases: ["twitter", "tw"],           icon: xIcon,         placeholder: "@username",                  group: "social" },
  { id: "threads",   name: "Threads",     aliases: [],                          icon: threadsIcon,   placeholder: "@username",                  group: "social" },
  { id: "telegram",  name: "Telegram",    aliases: ["tg"],                      icon: telegramIcon,  placeholder: "t.me/username",              group: "contact" },
  { id: "messenger", name: "Messenger",   aliases: ["fb messenger"],            icon: messengerIcon, placeholder: "m.me/username",              group: "contact" },
  { id: "discord",   name: "Discord",     aliases: [],                          icon: discordIcon,   placeholder: "discord.gg/invite",          group: "social" },
  { id: "twitch",    name: "Twitch",      aliases: [],                          icon: twitchIcon,    placeholder: "twitch.tv/username",         group: "social" },
  { id: "pinterest", name: "Pinterest",   aliases: ["pin"],                     icon: pinterestIcon, placeholder: "pinterest.com/username",     group: "social" },
  { id: "reddit",    name: "Reddit",      aliases: [],                          icon: websiteIcon,   placeholder: "reddit.com/u/username",      group: "social" },
  { id: "github",    name: "GitHub",      aliases: ["gh"],                      icon: websiteIcon,   placeholder: "github.com/username",        group: "professional" },
  { id: "behance",   name: "Behance",     aliases: ["be"],                      icon: websiteIcon,   placeholder: "behance.net/username",       group: "professional" },
  { id: "dribbble",  name: "Dribbble",    aliases: [],                          icon: websiteIcon,   placeholder: "dribbble.com/username",      group: "professional" },
  { id: "spotify",   name: "Spotify",     aliases: [],                          icon: websiteIcon,   placeholder: "open.spotify.com/artist/id", group: "music" },
  { id: "apple_music", name: "Apple Music", aliases: ["apple"],                 icon: websiteIcon,   placeholder: "music.apple.com/...",        group: "music" },
  { id: "tidal",     name: "Tidal",       aliases: [],                          icon: websiteIcon,   placeholder: "tidal.com/browse/...",       group: "music" },
  { id: "deezer",    name: "Deezer",      aliases: [],                          icon: websiteIcon,   placeholder: "deezer.com/...",             group: "music" },
  { id: "website",   name: "Website",     aliases: ["site", "web", "url"],      icon: websiteIcon,   placeholder: "www.my-website.com",         group: "contact" },
  { id: "email",     name: "Email",       aliases: ["mail", "e-mail"],          icon: emailIcon,     placeholder: "you@example.com",            group: "contact" },
  { id: "phone",     name: "Phone",       aliases: ["call", "tel"],             icon: phoneIcon,     placeholder: "+00000000000",               group: "contact" },
  { id: "zillow",    name: "Zillow",      aliases: ["real estate"],              icon: zillowIcon,    placeholder: "zillow.com/profile/username", group: "professional" },
];

/** Default 6 platform IDs for new influencer pages */
export const DEFAULT_PRIMARY_IDS = ["facebook", "tiktok", "instagram", "snapchat", "whatsapp", "youtube"];

/** Lookup by ID */
export function getPlatform(id: string): SocialPlatform | undefined {
  return PLATFORM_REGISTRY.find(p => p.id === id);
}

/** Search platforms by query string (matches name + aliases) */
export function searchPlatforms(query: string): SocialPlatform[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return PLATFORM_REGISTRY.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.aliases.some(a => a.toLowerCase().includes(q))
  );
}

/** Active social link slot */
export interface SocialSlot {
  platform: string;  // platform id
  url: string;
  slotIndex: number;
}
