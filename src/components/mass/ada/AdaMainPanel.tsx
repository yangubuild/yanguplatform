import { useState, useRef, useEffect, useCallback } from "react";
import { useSurfaceContext } from "@/contexts/SurfaceContext";
import { X, Mic, Settings, ChevronDown, Smartphone, Plus, ArrowUp, AudioLines, User, Loader2, Paperclip, Download, RefreshCw, Globe, CloudUpload, Palette, Code2, BarChart3, Image, Package, Megaphone, Users, UserCheck, Zap, Layout, Activity } from "lucide-react";
import adaLogo from "@/assets/ada-logo-full.png";
import { useAuth } from "@/hooks/useAuth";
import { useAdaVoice } from "@/hooks/useAdaVoice";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { consumeEntitlement } from "@/lib/entitlements";
import { executeWithRuntime, getEnabledWidgetsForSurface, runProviderAction } from "@/lib/runtime";
import type { RuntimeContext } from "@/lib/runtime";
import { useNavigate } from "react-router-dom";
import { MediaGenerationCard, type MediaGenStatus } from "./MediaGenerationCard";
import { AdaAuthModal } from "./AdaAuthModal";
import { AdaBottomSection } from "./AdaBottomSection";
import { QuotaReachedModal } from "./QuotaReachedModal";
import { ExportChatMenu } from "./ExportChatMenu";
import { DriveConnectModal } from "./DriveConnectModal";

type AdaMode = "auto" | "standard" | "cinema" | "motion";
type AdaSkill = "starter" | "creator" | "agency";

interface RoutingPill {
  mode: string;
  tier: string;
  provider: string;
  aspect?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  isStreaming?: boolean;
  routingPill?: RoutingPill;
  mediaGen?: {
    kind: "image" | "video";
    status: MediaGenStatus;
    progressStep?: string;
    previewUrl?: string;
    caption?: string;
    error?: string;
    retryPrompt?: string;
    retryProvider?: string;
    retryCid?: string;
  };
}

// Image / Video intent keyword detection
const IMAGE_KEYWORDS = ["poster", "banner", "ad", "thumbnail", "product shot", "flyer", "cover", "logo", "carousel", "facebook post", "social media poster", "instagram ad", "instagram post", "social media", "social post", "twitter post", "linkedin post"];
const VIDEO_KEYWORDS = ["video", "reel", "tiktok", "motion", "clip", "cinematic", "animation"];

// Keywords that indicate Creatify can handle the video (avatar, ad script, template, URL)
const CREATIFY_KEYWORDS = ["avatar", "template", "ad script", "script", "spokesperson", "presenter", "url-to-video", "product url", "landing page", "http://", "https://"];

function isCreatifyCompatible(text: string): boolean {
  const lower = text.toLowerCase();
  return CREATIFY_KEYWORDS.some(k => lower.includes(k));
}

// Social media prompt patterns for auto-routing to image
const SOCIAL_MEDIA_RE = /\b(create|make|generate|design)\s+(a\s+)?(facebook|instagram|twitter|linkedin|social\s*media)\s+(post|poster|ad|banner|story|carousel)\b/i;

// Require an explicit generative verb before any media keyword to avoid
// routing normal conversation as image/video generation.
const GENERATIVE_VERBS_RE = /\b(generate|create|make|draw|design|paint|sketch|build|produce)\b/i;

// Phrases that explicitly ask for TEXT — must always override media detection
const TEXT_OVERRIDE_RE = /\b(give\s+(it\s+)?(as|in)\s+words|write\s+it|text\s+(form|version|only)|as\s+text|don'?t\s+(generate|create|make)\s+(an?\s+)?image|no\s+image|words\s+not\s+image|in\s+words)\b/i;

function detectMediaIntent(text: string): "image" | "video" | null {
  const lower = text.toLowerCase();
  // If user explicitly wants text, never route to media
  if (TEXT_OVERRIDE_RE.test(lower)) return null;
  // Require a generative verb to be present
  if (!GENERATIVE_VERBS_RE.test(lower)) return null;
  if (VIDEO_KEYWORDS.some(k => lower.includes(k))) return "video";
  if (IMAGE_KEYWORDS.some(k => lower.includes(k))) return "image";
  return null;
}

function resolveAutoDirector(
  mode: AdaMode,
  skill: AdaSkill,
  mediaIntent: "image" | "video" | null,
  advOverride: boolean,
  advProvider: string,
): { tier: string; provider: string; kind: "image" | "video" | "chat" } {
  // If Advanced Mode explicitly set, that takes priority
  if (advOverride) {
    if (advProvider === "creatify") return { tier: "Studio Video Preview", provider: "ideogram", kind: "video" };
    if (advProvider === "ideogram") return { tier: "Cinema", provider: "ideogram", kind: "image" };
    if (advProvider === "qwen") return { tier: "Standard", provider: "qwen", kind: "image" };
    return { tier: "Standard", provider: "openai", kind: "chat" };
  }

  if (mode !== "auto") {
    // Non-auto modes only affect image/video quality when media IS explicitly requested
    // They should NEVER force image generation on plain text messages
    if (!mediaIntent) return { tier: "Standard", provider: "openai", kind: "chat" };
    if (mode === "motion") return { tier: "Studio Video Preview", provider: "ideogram", kind: mediaIntent === "image" ? "image" : "video" };
    if (mode === "cinema") return { tier: "Cinema", provider: "ideogram", kind: mediaIntent === "video" ? "video" : "image" };
    return { tier: "Standard", provider: mediaIntent === "video" ? "ideogram" : "qwen", kind: mediaIntent };
  }

  // Auto mode – route by skill tier + intent
  if (!mediaIntent) return { tier: "Standard", provider: "openai", kind: "chat" };

  if (skill === "starter") {
    return mediaIntent === "video"
      ? { tier: "Studio Video Preview", provider: "qwen", kind: "video" }
      : { tier: "Standard", provider: "qwen", kind: "image" };
  }
  if (skill === "creator") {
    return mediaIntent === "video"
      ? { tier: "Studio Video Preview", provider: "ideogram", kind: "video" }
      : { tier: "Cinema", provider: "ideogram", kind: "image" };
  }
  // agency
  return mediaIntent === "video"
    ? { tier: "Studio Video Preview", provider: "ideogram", kind: "video" }
    : { tier: "Cinema", provider: "ideogram", kind: "image" };
}

// localStorage helpers for anonymous users
const ANON_CHATS_KEY = "ada_anon_chats";
const ANON_ACTIVE_KEY = "ada_anon_active_chat";

function getAnonChats(): { id: string; title: string; messages: ChatMessage[] }[] {
  try { return JSON.parse(localStorage.getItem(ANON_CHATS_KEY) || "[]"); } catch { return []; }
}
function saveAnonChats(chats: { id: string; title: string; messages: ChatMessage[] }[]) {
  localStorage.setItem(ANON_CHATS_KEY, JSON.stringify(chats));
}

// --- SSE stream parser with typewriter-style token rendering ---
async function readSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (fullText: string) => void,
  onDone: () => void,
) {
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";
  // Token queue for typewriter effect
  const tokenQueue: string[] = [];
  let draining = false;

  const drainQueue = () => {
    if (draining || tokenQueue.length === 0) return;
    draining = true;
    const processNext = () => {
      if (tokenQueue.length === 0) { draining = false; return; }
      const token = tokenQueue.shift()!;
      // Emit word-by-word within the token
      const words = token.split(/(\s+)/);
      let i = 0;
      const emitWord = () => {
        if (i >= words.length) {
          // Small delay between tokens
          setTimeout(processNext, 10);
          return;
        }
        accumulated += words[i];
        i++;
        onChunk(accumulated);
        // 20-40ms delay between words for typewriter feel
        const delay = 20 + Math.random() * 20;
        setTimeout(emitWord, delay);
      };
      emitWord();
    };
    processNext();
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") {
        // Flush remaining queue then done
        const waitDrain = () => {
          if (tokenQueue.length === 0 && !draining) { onDone(); return; }
          setTimeout(waitDrain, 30);
        };
        waitDrain();
        return;
      }
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "token" && parsed.text) {
          tokenQueue.push(parsed.text);
          drainQueue();
        } else if (parsed.type === "done") {
          const waitDrain = () => {
            if (tokenQueue.length === 0 && !draining) { onDone(); return; }
            setTimeout(waitDrain, 30);
          };
          waitDrain();
          return;
        } else if (parsed.choices?.[0]?.delta?.content) {
          tokenQueue.push(parsed.choices[0].delta.content);
          drainQueue();
        }
      } catch { /* skip non-JSON lines */ }
    }
  }
  // Final drain
  const waitFinalDrain = () => {
    if (tokenQueue.length === 0 && !draining) { onDone(); return; }
    setTimeout(waitFinalDrain, 30);
  };
  waitFinalDrain();
}

// --- SSE stream parser for generation status events ---
async function readGenerationSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onStatus: (status: string, data: Record<string, unknown>) => void,
  onDone: () => void,
) {
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "generation_status") {
          onStatus(parsed.status, parsed);
        } else if (parsed.type === "done") {
          onDone(); return;
        }
      } catch { /* skip */ }
    }
  }
  onDone();
}

// Guest usage tracking key
const GUEST_USED_KEY = "ada_guest_used";

export function AdaMainPanel({ hideBottomSection, isLanding }: { hideBottomSection?: boolean; isLanding?: boolean } = {}) {
  const { user, profile, isAuthenticated } = useAuth();
  const { surfaceId: ctxSurfaceId } = useSurfaceContext();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [intent, setIntent] = useState<"search" | "discuss" | null>(null);
  const [inputValue, setInputValue] = useState("");
  // Forced mode from quick action buttons: "image" forces image gen, "text" forces text chat
  const [forcedMode, setForcedMode] = useState<"image" | "text" | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Guest gate: track if the 1 free message has been used
  const [guestUsed, setGuestUsed] = useState(() => localStorage.getItem(GUEST_USED_KEY) === "true");

  // In-place auth modal instead of redirect
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [quotaPopup, setQuotaPopup] = useState<{ used: number; limit: number; nextResetAt: string | null; tier: string } | null>(null);
  const requireAuth = useCallback(() => {
    if (isLanding) {
      navigate("/auth/signup?returnTo=/dashboard/ada");
      return;
    }
    setShowAuthModal(true);
  }, [isLanding, navigate]);
  const [voiceText, setVoiceText] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<{ name: string; type: string; size: number; path: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const extensionsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Smart auto-scroll: only scroll if user is within 200px of bottom
  // userScrolledUp stays true until user clicks "Jump to latest"
  const isNearBottomRef = useRef(true);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const checkNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 200;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    isNearBottomRef.current = near;
    if (near) setUserScrolledUp(false);
  }, []);

  const smartScroll = useCallback(() => {
    if (userScrolledUp) return;
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [userScrolledUp]);

  const jumpToLatest = useCallback(() => {
    setUserScrolledUp(false);
    isNearBottomRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ── Session context memory (resets per session) ──
  const [sessionGoal, setSessionGoal] = useState<string | null>(null);
  const [activeTaskLabel, setActiveTaskLabel] = useState<string | null>(null);
  const [suggestedNextAction, setSuggestedNextAction] = useState<string | null>(null);

  // ── Active Tasks (derived from conversation) ──
  const [activeTasks, setActiveTasks] = useState<string[]>([]);

  // Detect active tasks from ADA responses
  const detectActiveTasks = useCallback((content: string) => {
    const taskPatterns = [
      { re: /structur(e|ing)\s+(your\s+)?communit/i, label: "Structuring Community" },
      { re: /design(ing)?\s+(a\s+)?(studio|campaign|visual)/i, label: "Designing Studio Campaign" },
      { re: /generat(e|ing)\s+(brand|visual|image|asset)/i, label: "Generating Brand Assets" },
      { re: /plan(ning)?\s+(a\s+)?(creator|product)\s+offer/i, label: "Planning Creator Offer" },
      { re: /build(ing)?\s+(your\s+)?(brand|business)/i, label: "Building Brand Strategy" },
      { re: /publish(ing)?\s+(your\s+)?(surface|page|content)/i, label: "Publishing Content" },
      { re: /optimi(ze|zing)\s+(your\s+)?profile/i, label: "Optimizing Profile" },
      { re: /creat(e|ing)\s+(a\s+)?product/i, label: "Creating Product" },
    ];
    const detected: string[] = [];
    for (const p of taskPatterns) {
      if (p.re.test(content)) detected.push(p.label);
    }
    if (detected.length > 0) {
      setActiveTasks(prev => {
        const merged = [...new Set([...prev, ...detected])].slice(0, 4);
        return merged;
      });
    }

    // Detect session goal from user messages
    const goalPatterns = [
      { re: /launch\s+(a\s+)?(creator\s+)?brand/i, goal: "Launch Creator Brand" },
      { re: /build\s+(my\s+)?community/i, goal: "Build Community" },
      { re: /grow\s+(my\s+)?(audience|following|business)/i, goal: "Grow Business" },
      { re: /create\s+(a\s+)?product/i, goal: "Create Product" },
      { re: /start\s+(a\s+)?campaign/i, goal: "Start Campaign" },
    ];
    for (const g of goalPatterns) {
      if (g.re.test(content)) { setSessionGoal(g.goal); break; }
    }

    // Detect suggested next actions from ADA responses
    const nextActionMatch = content.match(/suggested next step:\s*(.+?)(?:\.|$)/i)
      || content.match(/next,?\s+let'?s\s+(.+?)(?:\.|$)/i);
    if (nextActionMatch) setSuggestedNextAction(nextActionMatch[1].trim().slice(0, 60));
  }, []);

  // Command center states
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showStylesDrawer, setShowStylesDrawer] = useState(false);

  // Provider preference (persisted in localStorage)
  const [selectedProvider, setSelectedProvider] = useState<string>(() => localStorage.getItem("ada_provider") || "openai");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>(() => localStorage.getItem("ada_aspect_ratio") || "1:1");
  const [advancedParams, setAdvancedParams] = useState<string>(() => localStorage.getItem("ada_params") || "");
  const [advancedOverride, setAdvancedOverride] = useState(false);

  // Skill Meter state (persisted in localStorage)
  const [adaMode, setAdaMode] = useState<AdaMode>(() => (localStorage.getItem("ada_mode") as AdaMode) || "auto");
  const [adaSkill, setAdaSkill] = useState<AdaSkill>(() => (localStorage.getItem("ada_skill") as AdaSkill) || "starter");

  const updateMode = (m: AdaMode) => { setAdaMode(m); localStorage.setItem("ada_mode", m); };
  const updateSkill = (s: AdaSkill) => { setAdaSkill(s); localStorage.setItem("ada_skill", s); };

  const updateProvider = (p: string) => { setSelectedProvider(p); localStorage.setItem("ada_provider", p); setAdvancedOverride(true); };
  const updateAspectRatio = (r: string) => { setSelectedAspectRatio(r); localStorage.setItem("ada_aspect_ratio", r); };
  const updateAdvancedParams = (v: string) => { setAdvancedParams(v); localStorage.setItem("ada_params", v); };

  // Right-side header icon states (persisted)
  const [mobilePreviewEnabled, setMobilePreviewEnabled] = useState(() => localStorage.getItem("ada_mobile_preview") === "true");
  const [showExtensionsDropdown, setShowExtensionsDropdown] = useState(false);
  const [enabledProviders, setEnabledProviders] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("ada_enabled_providers") || "{}"); } catch { return {}; }
  });
  const [showDriveConnect, setShowDriveConnect] = useState(false);

  const toggleProvider = (key: string) => {
    setEnabledProviders(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("ada_enabled_providers", JSON.stringify(next));
      return next;
    });
  };

  const toggleMobilePreview = () => {
    setMobilePreviewEnabled(prev => {
      const next = !prev;
      localStorage.setItem("ada_mobile_preview", String(next));
      return next;
    });
  };

  // Role context applied internally based on adaSkill
  const roleContext = adaSkill === "starter" ? "standard" : adaSkill === "creator" ? "image_priority" : "motion_priority";
  // Close extensions dropdown on outside click
  useEffect(() => {
    if (!showExtensionsDropdown) return;
    const handler = (e: MouseEvent) => {
      if (extensionsRef.current && !extensionsRef.current.contains(e.target as Node)) {
        setShowExtensionsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showExtensionsDropdown]);

  // Listen for command events from sidebar icons
  useEffect(() => {
    const handler = (e: Event) => {
      const cmd = (e as CustomEvent).detail;
      switch (cmd) {
        case "preview": {
          // Find the last media message with a URL and open it
          const lastMedia = [...messages].reverse().find(m => m.mediaGen?.previewUrl || m.metadata?.storage_path);
          if (lastMedia?.mediaGen?.previewUrl) {
            window.open(lastMedia.mediaGen.previewUrl, "_blank");
          } else {
            toast({ title: "No asset to preview", variant: "destructive" });
          }
          break;
        }
        case "save": {
          // Save last generated media to studio library
          const media = [...messages].reverse().find(m => m.mediaGen?.previewUrl);
          if (media?.mediaGen?.previewUrl && user) {
            supabase.from("ada_media").insert({
              user_id: user.id,
              chat_id: activeChatId || undefined,
              provider: (media.metadata as any)?.provider || "ada",
              storage_path: (media.metadata as any)?.storage_path || media.mediaGen!.previewUrl,
              kind: media.mediaGen!.kind,
              metadata: { prompt: media.mediaGen?.caption },
            }).then(({ error }) => {
              if (error) toast({ title: "Failed to save", variant: "destructive" });
              else toast({ title: "Saved to Studio ✓" });
            });
          } else {
            toast({ title: "No media to save", variant: "destructive" });
          }
          break;
        }
        case "styles":
          setShowStylesDrawer(true);
          break;
        case "advanced":
          setShowAdvancedModal(true);
          break;
        case "history":
          setShowHistoryDrawer(true);
          break;
      }
    };
    window.addEventListener("ada-command", handler);
    return () => window.removeEventListener("ada-command", handler);
  }, [messages, user, activeChatId]);

  // Scroll when a NEW message is added or thinking state changes (not on every content update)
  const messageCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length !== messageCountRef.current || isThinking) {
      messageCountRef.current = messages.length;
      // Only auto-scroll if user hasn't scrolled up
      if (!userScrolledUp) {
        smartScroll();
      }
    }
  }, [messages.length, isThinking, smartScroll, userScrolledUp]);

  // --- Chat session helpers ---
  const createDbChat = useCallback(async (firstMsg: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("ada_chats")
      .insert({ user_id: user.id, title: firstMsg.slice(0, 60) })
      .select("id")
      .single();
    if (error || !data) { console.error("create chat err", error); return null; }
    window.dispatchEvent(new CustomEvent("ada-chat-created"));
    return data.id as string;
  }, [user]);

  const createAnonChat = useCallback((firstMsg: string) => {
    const id = `anon_${Date.now()}`;
    const chats = getAnonChats();
    chats.unshift({ id, title: firstMsg.slice(0, 60), messages: [] });
    saveAnonChats(chats);
    window.dispatchEvent(new CustomEvent("ada-chat-created"));
    return id;
  }, []);

  const persistMessage = useCallback(async (chatId: string, msg: ChatMessage) => {
    if (isAuthenticated && user) {
      await supabase.from("ada_messages").insert([{
        chat_id: chatId,
        role: msg.role,
        content: msg.content,
        metadata: JSON.parse(JSON.stringify(msg.metadata || {})),
      }]);
    } else {
      const chats = getAnonChats();
      const chat = chats.find(c => c.id === chatId);
      if (chat) { chat.messages.push(msg); saveAnonChats(chats); }
    }
  }, [isAuthenticated, user]);

  // --- Search mode ---
  const handleSearch = useCallback(async (query: string, cid: string) => {
    setIsThinking(true);
    try {
      const { data: sources } = await supabase
        .from("knowledge_sources")
        .select("id, title, url, source_type")
        .ilike("title", `%${query}%`)
        .eq("is_active", true)
        .limit(5);

      const { data: chunks } = await supabase
        .from("knowledge_chunks")
        .select("id, content, source_id")
        .ilike("content", `%${query}%`)
        .limit(5);

      const { data: listings } = await supabase
        .from("surfaces")
        .select("id, title, surface_type, status")
        .ilike("title", `%${query}%`)
        .eq("status", "published")
        .limit(5);

      let searchContext = "";
      let found = false;

      if (sources && sources.length > 0) {
        found = true;
        searchContext += `Knowledge Sources:\n`;
        sources.forEach(s => { searchContext += `- ${s.title} (${s.source_type})${s.url ? ` — ${s.url}` : ""}\n`; });
      }
      if (chunks && chunks.length > 0) {
        found = true;
        searchContext += `Knowledge Chunks:\n`;
        chunks.forEach(c => { searchContext += `- ${c.content.slice(0, 120)}…\n`; });
      }
      if (listings && listings.length > 0) {
        found = true;
        searchContext += `Platform Listings:\n`;
        listings.forEach(l => { searchContext += `- ${l.title} (${l.surface_type})\n`; });
      }
      if (!found) {
        searchContext = `No results found for "${query}".`;
      }

      // Stream search results
      const convMessages = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
      convMessages.push({ role: "user", content: query });

      const streamMsgId = `msg_${Date.now()}`;
      const streamMsg: ChatMessage = {
        id: streamMsgId,
        role: "assistant",
        content: "",
        isStreaming: true,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, streamMsg]);
      setIsThinking(false);

      await streamChatResponse(convMessages, cid, streamMsgId, "search", searchContext);
    } catch (err) {
      console.error("[AdaSearch] Error:", err);
      const errMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: "Search failed. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
      setIsThinking(false);
    }
  }, [persistMessage, messages]);

  // --- Streaming chat response ---
  const streamChatResponse = useCallback(async (
    convMessages: { role: string; content: string }[],
    cid: string,
    msgId: string,
    intentType?: string,
    searchContext?: string,
    onComplete?: (finalContent: string) => void,
  ) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const session = (await supabase.auth.getSession()).data.session;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        apikey: supabaseKey,
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/ada-chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: convMessages,
          intent: intentType || "discuss",
          search_context: searchContext,
          stream: true,
        }),
      });

      if (!res.ok || !res.body) {
        // For guests who hit auth errors, show friendly message instead of "Not authenticated"
        const errData = await res.json().catch(() => null);
        const isAuthError = res.status === 401 || res.status === 403 || (errData?.error || "").toLowerCase().includes("not authenticated");
        const errorText = isAuthError
          ? "Sign up for a free account to continue chatting with Ada."
          : errData?.error || "I'm having trouble responding right now. Please try again.";
        if (!isAuthError && errData?.error) toast({ title: errData.error, variant: "destructive" });
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: errorText, isStreaming: false } : m));
        await persistMessage(cid, { id: msgId, role: "assistant", content: errorText, created_at: new Date().toISOString() });
        return;
      }

      const reader = res.body.getReader();

      // Throttled scroll during streaming: scroll at most every 300ms
      let lastScrollTime = 0;
      const throttledScroll = () => {
        const now = Date.now();
        if (now - lastScrollTime > 300) {
          lastScrollTime = now;
          smartScroll();
        }
      };

      await readSSEStream(
        reader,
        (fullText) => {
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: fullText } : m));
          throttledScroll();
        },
        () => {
          // Mark as done — read final content from the last flush
          setMessages(prev => {
            const msg = prev.find(m => m.id === msgId);
            const finalContent = msg?.content || "I couldn't generate a response. Please try again.";
            // Persist
            persistMessage(cid, { id: msgId, role: "assistant", content: finalContent, created_at: new Date().toISOString() });
            // Detect active tasks and session context from response
            detectActiveTasks(finalContent);
            // Call onComplete callback for post-stream action detection
            if (onComplete) onComplete(finalContent);
            return prev.map(m => m.id !== msgId ? m : { ...m, content: finalContent, isStreaming: false });
          });
        },
      );
    } catch (err) {
      console.error("[AdaStream] Error:", err);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: "I'm having trouble responding right now. Please try again.", isStreaming: false } : m));
    }
  }, [persistMessage, smartScroll]);

  // --- Image generation with progress card ---
  const handleImageGenerate = useCallback(async (prompt: string, cid: string, provider: "ideogram" | "qwen" | "gemini" = "ideogram") => {
    // Guests cannot generate images (RPC requires auth) — gate them
    if (!isAuthenticated) {
      const gateMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: "✨ To generate images, please sign in or create a free account. It only takes a moment!",
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, gateMsg]);
      await persistMessage(cid, gateMsg);
      requireAuth();
      return;
    }

    // Quota check via RPC
    const { data: quotaResult } = await supabase.rpc("check_and_increment_quota" as any, { p_quota_key: "ada_image" });
    if (quotaResult && typeof quotaResult === "object" && !(quotaResult as any).ok) {
      const qr = quotaResult as any;
      setQuotaPopup({
        used: qr.used ?? 0,
        limit: qr.limit ?? 0,
        nextResetAt: qr.next_reset_at ?? null,
        tier: qr.tier ?? "free",
      });
      return;
    }

    // Legacy entitlement check (fallback)
    const ent = await consumeEntitlement("image");
    if (!ent.allowed) {
      toast({
        title: ent.error || "You've reached your monthly limit. Upgrade to continue.",
        variant: "destructive",
        description: "Go to /subscriptions to upgrade your plan.",
      });
      const errMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: `⚠️ ${ent.error || "Monthly image limit reached."} [Upgrade your plan](/subscriptions) to continue generating.`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
      await persistMessage(cid, errMsg);
      return;
    }

    // Insert media generation card
    const mediaMsgId = `msg_${Date.now()}`;
    const mediaMsg: ChatMessage = {
      id: mediaMsgId,
      role: "assistant",
      content: "",
      mediaGen: {
        kind: "image",
        status: "queued",
        progressStep: "Queued…",
        retryPrompt: prompt,
        retryProvider: provider,
        retryCid: cid,
      },
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, mediaMsg]);

    try {
      // Resolve widget key from registry — fallback to convention if no registry entry
      const registryWidgets = ctxSurfaceId ? await getEnabledWidgetsForSurface(ctxSurfaceId) : [];
      const imageWidgetKey = registryWidgets.find(w => w.widget_key === `ada_image_${provider}`)?.widget_key
        ?? `ada_image_${provider}`;

      // Runtime execution guard — silently blocks if provider not permitted
      const runtimeCheck = await executeWithRuntime({
        surfaceId: ctxSurfaceId ?? undefined,
        widgetKey: imageWidgetKey,
        providerKey: provider,
        bucketKey: "image",
        run: async (ctx: RuntimeContext, token: string) => {
          const routerResult = await runProviderAction({
            ctx,
            token,
            providerKey: provider,
            action: "image.generate",
            payload: { prompt, chatId: cid, params: {} },
          });
          if (!routerResult.ok) {
            const failure = routerResult as { ok: false; reason: string; detail?: string };
            throw new Error(failure.detail || failure.reason);
          }
          return routerResult.data as any;
        },
      });

      // Runtime guard is authoritative — no fallback
      if (!runtimeCheck.ok) {
        const denial = runtimeCheck as { ok: false; reason: string };
        const reasonMap: Record<string, string> = {
          missing_runtime_context: "Runtime not configured for this surface.",
          widget_not_installed: "Widget not installed on this surface.",
          provider_not_permitted: "Provider not permitted for this app.",
          rate_limited: "Rate limit reached. Try again later.",
        };
        const userMsg = reasonMap[denial.reason] || "This action isn't permitted.";
        toast({ title: userMsg, variant: "destructive" });
        setMessages(prev => prev.map(m => m.id === mediaMsgId ? {
          ...m,
          mediaGen: { ...m.mediaGen!, status: "error" as MediaGenStatus, error: userMsg },
        } : m));
        return;
      }
      const result = runtimeCheck.result;

      // Update to generating
      setMessages(prev => prev.map(m => m.id === mediaMsgId ? { ...m, mediaGen: { ...m.mediaGen!, status: "generating" as MediaGenStatus, progressStep: "Generating…" } } : m));

      if (!result.ok || !result.images || result.images.length === 0) {
        console.error(`[AdaImage] ${provider} error:`, result.error);
        setMessages(prev => prev.map(m => m.id === mediaMsgId ? {
          ...m,
          mediaGen: { ...m.mediaGen!, status: "error" as MediaGenStatus, error: result.error || "Image generation failed" },
        } : m));
        return;
      }

      // Update to uploading
      setMessages(prev => prev.map(m => m.id === mediaMsgId ? { ...m, mediaGen: { ...m.mediaGen!, status: "uploading" as MediaGenStatus, progressStep: "Uploading…" } } : m));

      const img = result.images[0];
      // Short delay for UX
      await new Promise(r => setTimeout(r, 500));

      // Done!
      const caption = prompt.length > 50 ? prompt.slice(0, 47) + "…" : prompt;
      setMessages(prev => prev.map(m => m.id === mediaMsgId ? {
        ...m,
        content: `![Generated image](${img.url})`,
        mediaGen: { ...m.mediaGen!, status: "done" as MediaGenStatus, previewUrl: img.url, caption },
        metadata: { type: "image", provider, storage_path: img.storage_path, generation_id: result.generation_id },
      } : m));

      // Persist
      await persistMessage(cid, {
        id: mediaMsgId,
        role: "assistant",
        content: `![Generated image](${img.url})`,
        metadata: { type: "image", provider, storage_path: img.storage_path, generation_id: result.generation_id },
        created_at: new Date().toISOString(),
      });

      // Auto-save to ada_media so IMAGES tab picks it up
      // Gemini provider (via ada-generate-image edge fn) already inserts server-side, so skip to avoid duplicates
      if (user && img.storage_path && provider !== "gemini") {
        await supabase.from("ada_media").insert({
          user_id: user.id,
          chat_id: cid || undefined,
          provider: provider,
          storage_path: img.storage_path,
          kind: "image",
          metadata: { prompt_text: prompt, provider_used: provider, generation_id: result.generation_id },
        });
      }
      // Signal bottom section / sidebar to refresh images
      window.dispatchEvent(new CustomEvent("ada-media-saved"));
    } catch (err) {
      console.error("[AdaImage] Error:", err);
      setMessages(prev => prev.map(m => m.id === mediaMsgId ? {
        ...m,
        mediaGen: { ...m.mediaGen!, status: "error" as MediaGenStatus, error: "Image generation failed. Please try again." },
      } : m));
    }
  }, [persistMessage, isAuthenticated, requireAuth, ctxSurfaceId]);

  // --- Video generation with progress card ---
  const handleVideoGenerate = useCallback(async (prompt: string, cid: string) => {
    const ent = await consumeEntitlement("video");
    if (!ent.allowed) {
      toast({
        title: ent.error || "You've reached your monthly limit. Upgrade to continue.",
        variant: "destructive",
        description: "Go to /subscriptions to upgrade your plan.",
      });
      const errMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: `⚠️ ${ent.error || "Monthly video limit reached."} [Upgrade your plan](/subscriptions) to continue generating.`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
      await persistMessage(cid, errMsg);
      return;
    }

    const mediaMsgId = `msg_${Date.now()}`;
    const mediaMsg: ChatMessage = {
      id: mediaMsgId,
      role: "assistant",
      content: "",
      mediaGen: {
        kind: "video",
        status: "queued",
        progressStep: "Queued…",
        retryPrompt: prompt,
        retryCid: cid,
      },
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, mediaMsg]);

    try {
      // Resolve widget key from registry — fallback to convention if no registry entry
      const registryWidgets = ctxSurfaceId ? await getEnabledWidgetsForSurface(ctxSurfaceId) : [];
      const videoWidgetKey = registryWidgets.find(w => w.widget_key === "ada_video_creatify")?.widget_key
        ?? "ada_video_creatify";

      // Runtime execution guard for video provider (permission check only;
      // actual video generation uses SSE streaming below, not the router,
      // because SSE doesn't fit the request/response model)
      const runtimeCheck = await executeWithRuntime({
        surfaceId: ctxSurfaceId ?? undefined,
        widgetKey: videoWidgetKey,
        providerKey: "creatify",
        bucketKey: "video",
        run: async () => true as const,
      });

      if (!runtimeCheck.ok) {
        const denial = runtimeCheck as { ok: false; reason: string };
        const reasonMap: Record<string, string> = {
          missing_runtime_context: "Runtime not configured for this surface.",
          widget_not_installed: "Widget not installed on this surface.",
          provider_not_permitted: "Provider not permitted for this app.",
          rate_limited: "Rate limit reached. Try again later.",
        };
        const userMsg = reasonMap[denial.reason] || "This action isn't permitted.";
        toast({ title: userMsg, variant: "destructive" });
        setMessages(prev => prev.map(m => m.id === mediaMsgId ? {
          ...m,
          mediaGen: { ...m.mediaGen!, status: "error" as MediaGenStatus, error: userMsg },
        } : m));
        return;
      }

      // Create generation record via RPC
      const { data: generationId, error: rpcErr } = await supabase.rpc(
        "create_creatify_generation" as any,
        { p_prompt: prompt, p_params: {} as unknown as Record<string, string> }
      );

      if (rpcErr || !generationId) {
        console.error("[AdaVideo] RPC error:", rpcErr);
        setMessages(prev => prev.map(m => m.id === mediaMsgId ? {
          ...m,
          mediaGen: { ...m.mediaGen!, status: "error" as MediaGenStatus, error: rpcErr?.message || "Failed to create generation" },
        } : m));
        return;
      }

      // Call edge function with SSE streaming for progress
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const session = (await supabase.auth.getSession()).data.session;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        apikey: supabaseKey,
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/creatify-generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ generation_id: generationId, stream: true }),
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => null);
        console.error("[AdaVideo] Edge function error:", errData);
        setMessages(prev => prev.map(m => m.id === mediaMsgId ? {
          ...m,
          mediaGen: { ...m.mediaGen!, status: "error" as MediaGenStatus, error: errData?.message || "Video generation failed" },
        } : m));
        return;
      }

      // Read SSE progress events
      const reader = res.body.getReader();
      let finalAssetUrl: string | null = null;
      let finalGenId = generationId;

      await readGenerationSSE(
        reader,
        (status, data) => {
          const statusMap: Record<string, { mediaStatus: MediaGenStatus; step: string }> = {
            queued: { mediaStatus: "queued", step: "Queued…" },
            generating: { mediaStatus: "generating", step: "Generating video…" },
            uploading: { mediaStatus: "uploading", step: "Uploading…" },
            complete: { mediaStatus: "done", step: "Complete" },
            error: { mediaStatus: "error", step: "Failed" },
          };
          const mapped = statusMap[status] || { mediaStatus: status as MediaGenStatus, step: status };

          if (status === "complete" && data.asset_url) {
            finalAssetUrl = data.asset_url as string;
            const caption = prompt.length > 50 ? prompt.slice(0, 47) + "…" : prompt;
            setMessages(prev => prev.map(m => m.id === mediaMsgId ? {
              ...m,
              content: `🎬 Video generated: ${finalAssetUrl}`,
              mediaGen: { ...m.mediaGen!, status: "done" as MediaGenStatus, previewUrl: finalAssetUrl!, caption },
              metadata: { type: "video", provider: "creatify", generation_id: finalGenId },
            } : m));
          } else if (status === "error") {
            setMessages(prev => prev.map(m => m.id === mediaMsgId ? {
              ...m,
              mediaGen: { ...m.mediaGen!, status: "error" as MediaGenStatus, error: (data.error as string) || "Video generation failed" },
            } : m));
          } else {
            setMessages(prev => prev.map(m => m.id === mediaMsgId ? {
              ...m,
              mediaGen: { ...m.mediaGen!, status: mapped.mediaStatus, progressStep: mapped.step },
            } : m));
          }
          smartScroll();
        },
        () => {
          // If we got a final URL, persist it
          if (finalAssetUrl) {
            persistMessage(cid, {
              id: mediaMsgId,
              role: "assistant",
              content: `🎬 Video generated: ${finalAssetUrl}`,
              metadata: { type: "video", provider: "creatify", generation_id: finalGenId },
              created_at: new Date().toISOString(),
            });
          }
        },
      );
    } catch (err) {
      console.error("[AdaVideo] Error:", err);
      setMessages(prev => prev.map(m => m.id === mediaMsgId ? {
        ...m,
        mediaGen: { ...m.mediaGen!, status: "error" as MediaGenStatus, error: "Video generation failed. Please try again." },
      } : m));
    }
  }, [persistMessage, ctxSurfaceId]);

  // --- Retry media generation ---
  const handleRetryMedia = useCallback((msg: ChatMessage) => {
    if (!msg.mediaGen) return;
    const { retryPrompt, retryProvider, retryCid, kind } = msg.mediaGen;
    if (!retryPrompt || !retryCid) return;
    // Remove the failed card
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    if (kind === "image") {
      handleImageGenerate(retryPrompt, retryCid, (retryProvider as "ideogram" | "qwen" | "gemini") || "ideogram");
    } else {
      handleVideoGenerate(retryPrompt, retryCid);
    }
  }, [handleImageGenerate, handleVideoGenerate]);

  // --- Discuss mode: stream AI response ---
  const handleDiscuss = useCallback(async (text: string, cid: string) => {
    const convMessages = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
    convMessages.push({ role: "user", content: text });

    const streamMsgId = `msg_${Date.now()}`;
    const streamMsg: ChatMessage = {
      id: streamMsgId,
      role: "assistant",
      content: "",
      isStreaming: true,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, streamMsg]);

    await streamChatResponse(convMessages, cid, streamMsgId);
  }, [messages, streamChatResponse]);

  // --- Helper to add routing pill to a message ---
  const addRoutingPill = useCallback((msgId: string, pill: RoutingPill) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, routingPill: pill } : m));
  }, []);

  // --- Send message with Auto Director ---
  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText || inputValue).trim();
    if (!text && pendingAttachments.length === 0) return;

    // --- Guest gate: allow exactly 1 free message ---
    if (!isAuthenticated) {
      if (guestUsed) {
        // Second attempt → redirect to signup
        requireAuth();
        return;
      }
      // Mark as used after this message
      setGuestUsed(true);
      localStorage.setItem(GUEST_USED_KEY, "true");
    }

    const currentIntent = intent;
    const currentForcedMode = forcedMode;
    setIntent(null);
    setForcedMode(null);

    let cid = activeChatId;
    if (!cid) {
      cid = isAuthenticated ? await createDbChat(text || "Attachment") : createAnonChat(text || "Attachment");
      if (!cid) return;
      setActiveChatId(cid);
    }

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      metadata: pendingAttachments.length > 0 ? { attachments: pendingAttachments } : undefined,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setPendingAttachments([]);
    await persistMessage(cid, userMsg);
    // Detect session goal from user message
    detectActiveTasks(text);

    // --- Explicit command routing (highest priority) ---
    if (text.startsWith("/video ")) {
      const videoPrompt = text.slice(7).trim();
      if (videoPrompt) {
        // ADA does not generate video — generate a poster frame + Studio CTA
        const prov = (enabledProviders.ideogram_image !== false) ? "ideogram" : "qwen";
        await handleImageGenerate(videoPrompt, cid, prov as "ideogram" | "qwen");
        // Add Studio CTA message with script suggestions
        const studioMsg: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: "assistant",
          content: `🎬 **Video is created in yangu Studio.**\n\nI've generated a poster frame above. Here are suggested ad scripts:\n\n**15s script:** "${videoPrompt.slice(0, 80)} — discover more today."\n\n**30s script:** "Introducing ${videoPrompt.slice(0, 60)}. Built for creators who move fast. See what's possible — only on yangu."\n\n👉 [Open yangu Studio](/studio) to create your video.`,
          routingPill: { mode: "Auto", tier: "Studio Video Preview", provider: prov === "ideogram" ? "Ideogram" : "Qwen" },
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, studioMsg]);
        await persistMessage(cid, studioMsg);
      } else {
        const errMsg: ChatMessage = { id: `msg_${Date.now()}`, role: "assistant", content: "Please provide a prompt after `/video`.", created_at: new Date().toISOString() };
        setMessages(prev => [...prev, errMsg]);
        await persistMessage(cid, errMsg);
      }
      return;
    }
    if (text.startsWith("/image:qwen ")) {
      const imagePrompt = text.slice(12).trim();
      if (imagePrompt) await handleImageGenerate(imagePrompt, cid, "qwen");
      return;
    }
    if (text.startsWith("/image ")) {
      const imagePrompt = text.slice(7).trim();
      if (imagePrompt) {
        const routing = resolveAutoDirector(adaMode, adaSkill, "image", advancedOverride, selectedProvider);
        const prov = (routing.provider === "qwen" || routing.provider === "ideogram") ? routing.provider : "ideogram";
        await handleImageGenerate(imagePrompt, cid, prov as "ideogram" | "qwen");
      }
      return;
    }

    // --- Search mode ---
    if (currentIntent === "search" && text) {
      await handleSearch(text, cid);
      return;
    }

    // --- Forced mode from quick action buttons ---
    if (currentForcedMode === "image") {
      // "Generate Image" button was clicked — route directly to image generation
      if (import.meta.env.DEV) console.log("[ADA Mode Debug] forcedMode=IMAGE, provider=auto");
      const routing = resolveAutoDirector(adaMode, adaSkill, "image", advancedOverride, selectedProvider);
      const prov = (routing.provider === "qwen" || routing.provider === "ideogram") ? routing.provider : "ideogram";
      const cleanPrompt = text.replace(/^(generate|create|make|draw|design)\s+(me\s+)?(an?\s+)?(image|picture|visual|logo|poster|banner)\s*(of\s+)?/i, "").trim() || text;
      await handleImageGenerate(cleanPrompt, cid, prov as "ideogram" | "qwen");
      return;
    }

    if (currentForcedMode === "text") {
      // Text-only action button was clicked (Plan Product, Create Campaign, etc.)
      if (import.meta.env.DEV) console.log("[ADA Mode Debug] forcedMode=TEXT");
      const streamMsgId = `msg_${Date.now()}`;
      const streamMsg: ChatMessage = { id: streamMsgId, role: "assistant", content: "", isStreaming: true, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, streamMsg]);
      const convMessages = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
      convMessages.push({ role: "user", content: text });
      await streamChatResponse(convMessages, cid, streamMsgId);
      return;
    }

    // --- Auto Director: detect media intent ---
    // If user explicitly asks for text, always use text mode
    if (TEXT_OVERRIDE_RE.test(text.toLowerCase())) {
      if (import.meta.env.DEV) console.log("[ADA Mode Debug] TEXT_OVERRIDE detected");
      const streamMsgId = `msg_${Date.now()}`;
      const streamMsg: ChatMessage = { id: streamMsgId, role: "assistant", content: "", isStreaming: true, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, streamMsg]);
      const convMessages = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
      convMessages.push({ role: "user", content: text });
      await streamChatResponse(convMessages, cid, streamMsgId);
      return;
    }

    const mediaIntent = detectMediaIntent(text);
    const imageIntentPatterns = [
      /^(generate|create|make|draw|design|paint|sketch)\s+(an?\s+)?image\b/,
      /^(generate|create|make|draw|design|paint|sketch)\s+(an?\s+)?(picture|photo|illustration|artwork|logo|icon|graphic|poster|banner)\b/,
      /\b(generate|create|make|draw)\s+(me\s+)?(an?\s+)?image\b/,
    ];
    const isExplicitImageIntent = imageIntentPatterns.some(p => p.test(text.toLowerCase()));
    const isSocialMediaIntent = SOCIAL_MEDIA_RE.test(text);
    const effectiveIntent = isExplicitImageIntent || isSocialMediaIntent ? "image" : mediaIntent;

    if (import.meta.env.DEV) console.log("[ADA Mode Debug] auto-detect:", { mediaIntent, effectiveIntent, kind: effectiveIntent || "chat" });
    const routing = resolveAutoDirector(adaMode, adaSkill, effectiveIntent, advancedOverride, selectedProvider);
    const pill: RoutingPill = {
      mode: adaMode === "auto" ? "Auto" : adaMode.charAt(0).toUpperCase() + adaMode.slice(1),
      tier: routing.tier,
      provider: routing.provider === "ideogram" ? "Ideogram" : routing.provider === "qwen" ? "Qwen" : routing.provider === "creatify" ? "Creatify" : "OpenAI",
      aspect: selectedAspectRatio,
    };

    if (routing.kind === "video") {
      // ADA does not generate video — always generate poster frame + Studio CTA
      const videoProv = (enabledProviders.ideogram_image !== false) ? "ideogram" : "qwen";
      pill.tier = "Studio Video Preview";
      pill.provider = videoProv === "ideogram" ? "Ideogram" : "Qwen";
      await handleImageGenerate(text, cid, videoProv as "ideogram" | "qwen");
      // Studio CTA message
      const studioMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: `🎬 **Video is created in yangu Studio.**\n\nI've generated a poster frame above. Here are suggested ad scripts:\n\n**15s script:** "${text.slice(0, 80)} — discover more today."\n\n**30s script:** "Introducing ${text.slice(0, 60)}. Built for creators who move fast. See what's possible — only on yangu."\n\n👉 [Open yangu Studio](/studio) to create your video.`,
        routingPill: pill,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, studioMsg]);
      await persistMessage(cid, studioMsg);
    } else if (routing.kind === "image" || isExplicitImageIntent) {
      const cleanPrompt = isExplicitImageIntent
        ? text.replace(/^(generate|create|make|draw|design|paint|sketch)\s+(me\s+)?(an?\s+)?(image|picture|photo|illustration|artwork|logo|icon|graphic|poster|banner)\s*(of\s+)?/i, "").replace(/^(an?\s+)?(image|picture)\s+of\s+/i, "").trim() || text
        : text;
      const prov = (routing.provider === "qwen" || routing.provider === "ideogram") ? routing.provider : "ideogram";
      await handleImageGenerate(cleanPrompt, cid, prov as "ideogram" | "qwen");
    } else {
      // Chat / discuss
      const streamMsgId = `msg_${Date.now()}`;
      const streamMsg: ChatMessage = {
        id: streamMsgId, role: "assistant", content: "",
        isStreaming: true, routingPill: pill,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, streamMsg]);
      const convMessages = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
      convMessages.push({ role: "user", content: text });
      await streamChatResponse(convMessages, cid, streamMsgId, undefined, undefined, async (finalContent: string) => {
        // Post-stream: if the AI tried to trigger image/video actions via JSON,
        // just strip those tokens and leave the text response.
        // Image generation only happens through explicit user intent (commands, verbs).
        const actionImageRe = /\{\s*"?action"?\s*:\s*"?image"?\s*\}/gi;
        const actionVideoRe = /\{\s*"?action"?\s*:\s*"?video"?\s*\}/gi;
        const pleaseCmdRe = /please\s+use\s+the\s+\/image\s+command[^.]*/gi;
        
        const cleaned = finalContent
          .replace(actionImageRe, "")
          .replace(actionVideoRe, "")
          .replace(pleaseCmdRe, "")
          .trim();
        
        if (cleaned !== finalContent) {
          // Update the message with cleaned content (no auto-generation)
          setMessages(prev => prev.map(m => m.id === streamMsgId
            ? { ...m, content: cleaned || "I can help you create images — just say \"generate an image of...\" or use `/image <prompt>`." }
            : m
          ));
        }
      });
    }
  }, [inputValue, activeChatId, isAuthenticated, guestUsed, pendingAttachments, intent, forcedMode, selectedProvider, adaMode, adaSkill, advancedOverride, selectedAspectRatio, createDbChat, createAnonChat, persistMessage, handleSearch, handleDiscuss, handleImageGenerate, handleVideoGenerate, streamChatResponse, messages, addRoutingPill, requireAuth]);

  // --- Voice ---
  const handleVoiceTranscript = useCallback(async (
    transcript: string,
    _meta: { audio_path: string; language: string; duration_ms: number; mime_type: string; size_bytes: number }
  ) => {
    setMode("chat");
    setVoiceText("");
    if (!transcript.trim()) return;

    // Place transcribed text into input — do NOT auto-send, let user review and confirm
    setInputValue(transcript);
    textareaRef.current?.focus();
  }, []);

  const { isRecording, isTranscribing, startRecording, stopRecording, cancelRecording } = useAdaVoice({
    chatId: activeChatId,
    userId: user?.id ?? null,
    isAuthenticated,
    onTranscript: handleVoiceTranscript,
  });

  // --- Attachments ---
  const handleAttachClick = useCallback(() => {
    if (!isAuthenticated) {
      requireAuth();
      return;
    }
    fileInputRef.current?.click();
  }, [isAuthenticated, requireAuth]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    let cid = activeChatId;
    if (!cid) {
      cid = await createDbChat("File attachment");
      if (!cid) return;
      setActiveChatId(cid);
    }

    for (const file of Array.from(files)) {
      const ts = Date.now();
      // Sanitize filename: replace spaces and special chars to avoid Storage "Invalid key" errors
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${user.id}/${cid}/${ts}-${safeName}`;
      const { error } = await supabase.storage.from("ada-uploads").upload(filePath, file, { upsert: false });
      if (error) {
        console.error("[AdaUpload] Storage error:", error);
        toast({ title: `Failed to upload ${file.name}`, variant: "destructive" });
        continue;
      }
      setPendingAttachments(prev => [...prev, { name: file.name, type: file.type, size: file.size, path: filePath }]);

      // If it's an image, also insert ada_media record so Images panel picks it up
      const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name) || file.type.startsWith("image/");
      if (isImage) {
        await supabase.from("ada_media").insert({
          user_id: user.id,
          chat_id: cid || undefined,
          provider: "upload",
          storage_path: filePath,
          kind: "image",
          metadata: { prompt_text: file.name, source: "upload", mime_type: file.type, size_bytes: file.size },
        });
        window.dispatchEvent(new CustomEvent("ada-media-saved"));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [user, activeChatId, createDbChat]);

  // --- Voice mode ---
  const startVoice = () => {
    if (!isAuthenticated) {
      requireAuth();
      return;
    }
    setMode("voice");
    setVoiceText("");
    startRecording();
  };

  const stopVoice = () => {
    stopRecording();
  };

  const cancelVoice = () => {
    cancelRecording();
    setMode("chat");
    setVoiceText("");
  };

  // --- New Chat ---
  useEffect(() => {
    const handler = () => {
      setActiveChatId(null);
      setMessages([]);
      setIsThinking(false);
      setPendingAttachments([]);
      setInputValue("");
      // Reset session context
      setSessionGoal(null);
      setActiveTaskLabel(null);
      setSuggestedNextAction(null);
      setActiveTasks([]);
    };
    window.addEventListener("ada-new-chat", handler);
    return () => window.removeEventListener("ada-new-chat", handler);
  }, []);

  // Load chat from sidebar
  useEffect(() => {
    const handler = async (e: Event) => {
      const chatId = (e as CustomEvent).detail;
      if (!chatId) return;
      setActiveChatId(chatId);
      setIsThinking(false);
      setPendingAttachments([]);
      setInputValue("");

      if (isAuthenticated) {
        const { data } = await supabase
          .from("ada_messages")
          .select("*")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: true });
        setMessages((data || []).map(m => {
          const meta = m.metadata as Record<string, unknown> | undefined;
          const msg: ChatMessage = {
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            metadata: meta,
            created_at: m.created_at,
          };
          // Re-hydrate media generation cards from persisted metadata
          if (meta?.type === "image" && meta?.storage_path) {
            const imgUrlMatch = m.content.match(/!\[.*?\]\((.*?)\)/);
            const previewUrl = imgUrlMatch?.[1] || (meta.storage_path as string);
            msg.mediaGen = {
              kind: "image",
              status: "done",
              previewUrl,
              caption: m.content.slice(0, 50),
            };
          }
          return msg;
        }));
      } else {
        const chats = getAnonChats();
        const chat = chats.find(c => c.id === chatId);
        setMessages(chat?.messages || []);
      }
    };
    window.addEventListener("ada-load-chat", handler);
    return () => window.removeEventListener("ada-load-chat", handler);
  }, [isAuthenticated]);

  // --- Rotating words ---
  const [boxSize, setBoxSize] = useState({ w: 0, h: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const traceRef = useRef<SVGRectElement>(null);
  const glowRef = useRef<SVGRectElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBoxSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const perim = boxSize.w && boxSize.h ? 2 * (boxSize.w + boxSize.h - 4 * 16) + 2 * Math.PI * 16 : 0;
  const dashLen = perim * 0.15;
  const gapLen = perim - dashLen;

  useEffect(() => {
    if (!perim) return;
    let raf: number;
    let start: number | null = null;
    const duration = 3000;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const progress = ((ts - start) % duration) / duration;
      const offset = -progress * perim;
      if (traceRef.current) traceRef.current.style.strokeDashoffset = `${offset}`;
      if (glowRef.current) glowRef.current.style.strokeDashoffset = `${offset}`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [perim]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [inputValue]);

  const rotatingWords = ["Own", "Idea", "Business", "Product", "Community"];
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState("Own");
  const phaseRef = useRef<"hold" | "erase" | "pause" | "type">("hold");

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const currentWord = rotatingWords[wordIndex];
    const nextWord = rotatingWords[(wordIndex + 1) % rotatingWords.length];

    if (phaseRef.current === "hold") {
      setDisplayText(currentWord);
      timeout = setTimeout(() => {
        phaseRef.current = "erase";
        setDisplayText(currentWord);
        let i = currentWord.length;
        const eraseStep = () => {
          i--;
          if (i > 0) {
            setDisplayText(currentWord.slice(0, i));
            timeout = setTimeout(eraseStep, 45);
          } else {
            setDisplayText("");
            timeout = setTimeout(() => {
              phaseRef.current = "type";
              let j = 0;
              const typeStep = () => {
                j++;
                if (j <= nextWord.length) {
                  setDisplayText(nextWord.slice(0, j));
                  timeout = setTimeout(typeStep, 55);
                } else {
                  phaseRef.current = "hold";
                  setWordIndex((prev) => (prev + 1) % rotatingWords.length);
                }
              };
              typeStep();
            }, 120);
          }
        };
        eraseStep();
      }, 1200);
    }

    return () => clearTimeout(timeout);
  }, [wordIndex]);

   // Welcome message removed — info now covered by the 1-4 steps section below

  const hasMessages = messages.length > 0;
  const placeholder = intent === "search"
    ? "Search yangu (products, services, tools)…"
    : intent === "discuss"
    ? "Discuss with Ada…"
    : "Ask Ada…";

  // --- Media URL / HTML tag detection helpers ---
  const MEDIA_URL_RE = /https?:\/\/[^\s"'<>]+\.(?:mp4|webm|mov|ogg|mp3|wav|m4a|png|jpg|jpeg|gif|webp|svg)(?:\?[^\s"'<>]*)?/gi;
  const VIDEO_TAG_RE = /<video[^>]*src=["']([^"']+)["'][^>]*\/?>/gi;
  const AUDIO_TAG_RE = /<audio[^>]*src=["']([^"']+)["'][^>]*\/?>/gi;
  const IMG_TAG_RE = /<img[^>]*src=["']([^"']+)["'][^>]*\/?>/gi;
  const SUPABASE_MEDIA_RE = /https?:\/\/[^\s"'<>]*supabase[^\s"'<>]*\/storage\/v1\/object\/[^\s"'<>]+/gi;

  const isMediaUrl = (url: string): "image" | "video" | "audio" | null => {
    const lower = url.toLowerCase().split("?")[0];
    if (/\.(mp4|webm|mov|ogg)$/.test(lower)) return "video";
    if (/\.(mp3|wav|m4a)$/.test(lower)) return "audio";
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(lower)) return "image";
    return null;
  };

  const renderInlineMedia = (url: string, kind: "image" | "video" | "audio", idx: number) => {
    if (kind === "video") {
      return (
        <div key={idx} className="my-2 rounded-xl overflow-hidden max-w-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <video
            src={url}
            controls
            playsInline
            className="w-full max-h-[400px] object-contain bg-black"
          />
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-white/40">Video</span>
            <a href={url} download={`ada-video-${Date.now()}.mp4`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors" title="Download">
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      );
    }
    if (kind === "audio") {
      return (
        <div key={idx} className="my-2 rounded-xl overflow-hidden max-w-sm p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <audio src={url} controls className="w-full" />
        </div>
      );
    }
    // image
    return (
      <div key={idx} className="relative inline-block my-2">
        <img src={url} alt="Generated" className="rounded-lg max-w-full" style={{ maxHeight: "400px" }} loading="lazy" />
        <a href={url} download={`ada-image-${Date.now()}.png`} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors" title="Download">
          <Download className="w-4 h-4" />
        </a>
      </div>
    );
  };

  // Strips internal reasoning/thought blocks from content
  const stripThoughts = (text: string): string => {
    return text
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
      .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
      .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
      .replace(/<internal>[\s\S]*?<\/internal>/gi, "")
      .trim();
  };

  // --- Render message content (text with optional streaming cursor) ---
  const renderMessageContent = (msg: ChatMessage) => {
    // Media generation card (from live generation flow)
    if (msg.mediaGen) {
      return (
        <MediaGenerationCard
          kind={msg.mediaGen.kind}
          status={msg.mediaGen.status}
          progressStep={msg.mediaGen.progressStep}
          previewUrl={msg.mediaGen.previewUrl}
          caption={msg.mediaGen.caption}
          error={msg.mediaGen.error}
          onRetry={msg.mediaGen.status === "error" ? () => handleRetryMedia(msg) : undefined}
        />
      );
    }

    let content = stripThoughts(msg.content);
    if (!content && msg.isStreaming) {
      return <span className="inline-block w-[2px] h-[1em] bg-[#F4A83D] ml-0.5 align-middle animate-pulse" />;
    }

    // Detect HTML media tags and convert to components
    const hasHtmlMedia = VIDEO_TAG_RE.test(content) || AUDIO_TAG_RE.test(content) || IMG_TAG_RE.test(content);
    // Reset lastIndex after test
    VIDEO_TAG_RE.lastIndex = 0; AUDIO_TAG_RE.lastIndex = 0; IMG_TAG_RE.lastIndex = 0;

    // Detect markdown images
    const hasMarkdownImg = /!\[.*?\]\(.*?\)/.test(content);

    // Detect bare media URLs (including Supabase signed URLs)
    const hasBareMediaUrls = MEDIA_URL_RE.test(content) || SUPABASE_MEDIA_RE.test(content);
    MEDIA_URL_RE.lastIndex = 0; SUPABASE_MEDIA_RE.lastIndex = 0;

    if (hasHtmlMedia || hasMarkdownImg || hasBareMediaUrls) {
      // Build a unified regex to split content into text and media parts
      const parts: { type: "text" | "media"; value: string; mediaKind?: "image" | "video" | "audio" }[] = [];
      
      // Replace HTML tags with placeholders and extract URLs
      let processed = content;
      const mediaUrls: { url: string; kind: "image" | "video" | "audio" }[] = [];

      // Extract <video src="...">
      processed = processed.replace(/<video[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, (_match, url) => {
        mediaUrls.push({ url, kind: "video" });
        return `\n__MEDIA_${mediaUrls.length - 1}__\n`;
      });
      // Extract <audio src="...">
      processed = processed.replace(/<audio[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, (_match, url) => {
        mediaUrls.push({ url, kind: "audio" });
        return `\n__MEDIA_${mediaUrls.length - 1}__\n`;
      });
      // Extract <img src="...">
      processed = processed.replace(/<img[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, (_match, url) => {
        mediaUrls.push({ url, kind: "image" });
        return `\n__MEDIA_${mediaUrls.length - 1}__\n`;
      });
      // Extract markdown images ![alt](url)
      processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, _alt, url) => {
        mediaUrls.push({ url, kind: "image" });
        return `\n__MEDIA_${mediaUrls.length - 1}__\n`;
      });
      // Extract bare media URLs not already captured
      processed = processed.replace(MEDIA_URL_RE, (url) => {
        // Skip if already captured
        if (mediaUrls.some(m => m.url === url)) return url;
        const kind = isMediaUrl(url);
        if (kind) {
          mediaUrls.push({ url, kind });
          return `\n__MEDIA_${mediaUrls.length - 1}__\n`;
        }
        return url;
      });

      // Split processed text into parts
      const segments = processed.split(/\n?(__MEDIA_\d+__)\n?/);
      
      return (
        <div>
          {segments.map((seg, idx) => {
            const mediaMatch = seg.match(/^__MEDIA_(\d+)__$/);
            if (mediaMatch) {
              const mediaIdx = parseInt(mediaMatch[1]);
              const media = mediaUrls[mediaIdx];
              if (media) return renderInlineMedia(media.url, media.kind, idx);
            }
            const trimmed = seg.trim();
            if (!trimmed) return null;
            return <span key={idx} style={{ whiteSpace: "pre-wrap" }}>{trimmed}</span>;
          })}
          {msg.isStreaming && (
            <span className="inline-block w-[2px] h-[1em] bg-[#F4A83D] ml-0.5 align-middle animate-pulse" />
          )}
        </div>
      );
    }

    // Plain text with streaming cursor
    return (
      <span style={{ whiteSpace: "pre-wrap" }}>
        {content}
        {msg.isStreaming && (
          <span className="inline-block w-[2px] h-[1em] bg-[#F4A83D] ml-0.5 align-middle animate-pulse" />
        )}
      </span>
    );
  };

  return (
    <main
      className="flex-1 flex flex-col min-h-0 overflow-hidden"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/png,image/jpeg,image/webp,application/pdf,.doc,.docx,.txt"
        multiple
        onChange={handleFileSelect}
      />

      {/* Top bar */}
      {!isLanding && (
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("ada-new-chat"))}
          className="text-sm text-white/80 hover:text-[#F4A83D] transition-colors"
        >
          + New Chat
        </button>
        <div className="flex items-center gap-3">
          {/* Export chat menu */}
          <ExportChatMenu chatId={activeChatId} onDriveConnect={() => setShowDriveConnect(true)} />

          {/* Phone: Toggle mobile preview mode */}
          <button
            onClick={toggleMobilePreview}
            className={`p-2 rounded-lg border transition-colors ${mobilePreviewEnabled ? "text-[#F4A83D] border-[#F4A83D]/30 bg-[#F4A83D]/10" : "text-white/40 hover:text-white/70 border-white/10"}`}
            style={!mobilePreviewEnabled ? { background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08))" } : undefined}
            title={mobilePreviewEnabled ? "Mobile preview ON" : "Mobile preview OFF"}
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Extensions: Provider toggles dropdown */}
          <div className="relative" ref={extensionsRef}>
            <button
              onClick={() => setShowExtensionsDropdown(prev => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-white/50 text-sm hover:text-white/70"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08))" }}
            >
              <Settings className="w-3.5 h-3.5" />
              Extensions
              <ChevronDown className="w-3 h-3" />
            </button>
            {showExtensionsDropdown && (
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-xl py-2 z-50 shadow-xl"
                style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30 font-medium">Provider Toggles</p>
                {[
                  { key: "openai_reasoning", label: "OpenAI (Reasoning)", color: "emerald" },
                  { key: "ideogram_image", label: "Ideogram (Image)", color: "amber" },
                  { key: "gemini_image", label: "Gemini (Image)", color: "amber" },
                  { key: "qwen_image", label: "Qwen (Image)", color: "amber" },
                  { key: "creatify_video", label: "Creatify (Video)", color: "blue" },
                  { key: "heygen_avatar", label: "HeyGen (Avatar)", color: "blue" },
                  { key: "did_avatar", label: "D-ID (Avatar)", color: "blue" },
                ].map(p => (
                  <button
                    key={p.key}
                    onClick={() => toggleProvider(p.key)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors"
                  >
                    <span>{p.label}</span>
                    <span className={`w-2 h-2 rounded-full ${enabledProviders[p.key] !== false ? "bg-emerald-400" : "bg-white/20"}`} />
                  </button>
                ))}
                <div className="border-t border-white/5 mt-1 pt-1 px-3 py-1">
                  <p className="text-[10px] text-white/25">Disabled providers are skipped during routing.</p>
                </div>
              </div>
            )}
          </div>

          {/* Profile avatar removed — available in dashboard nav */}
        </div>
      </div>
      )}

      {/* Center content — equal gutters so content is visually centered in this container */}
      <div className="flex-1 flex flex-col items-center justify-center pl-12 pr-4 min-h-0 overflow-hidden">
        {mode === "voice" ? (
          <>
            {/* Animated particle ring */}
            <div className="relative w-[280px] h-[280px] mb-10">
              <svg
                viewBox="0 0 280 280"
                className="w-full h-full animate-spin"
                style={{ animationDuration: "40s" }}
              >
                {Array.from({ length: 300 }).map((_, i) => {
                  const angle = (i / 300) * Math.PI * 2;
                  const radius = 100 + Math.random() * 30;
                  const cx = 140 + Math.cos(angle) * radius;
                  const cy = 140 + Math.sin(angle) * radius;
                  const size = Math.random() * 3 + 1;
                  const opacity = Math.random() * 0.7 + 0.3;
                  return (
                    <rect key={i} x={cx} y={cy} width={size} height={size} fill="white" opacity={opacity} rx={0.5} />
                  );
                })}
              </svg>
            </div>

            <p className="text-white/70 text-center text-base md:text-lg max-w-md mb-2 leading-relaxed">
              {voiceText.split("sunset").map((part, i, arr) =>
                i < arr.length - 1 ? (
                  <span key={i}>{part}<span className="text-[#E0A030]">sunset</span></span>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </p>
            <p className="text-white/40 text-sm mb-6">
              {isTranscribing ? "Transcribing..." : "Listening..."}
            </p>

            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={cancelVoice}
                className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={stopVoice}
                className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                style={{
                  background: isRecording
                    ? "linear-gradient(135deg, #dc2626, #ef4444)"
                    : "linear-gradient(135deg, #D4952B, #F4A83D)",
                  boxShadow: isRecording ? "0 0 20px rgba(220,38,38,0.4)" : "0 0 20px rgba(212,149,43,0.2)",
                }}
              >
                {isRecording ? <Mic className="w-6 h-6 animate-pulse" /> : <ArrowUp className="w-6 h-6" />}
              </button>
            </div>
          </>
        ) : hasMessages ? (
          <>
            {/* Chat thread */}
            <div
              ref={scrollContainerRef}
              onScroll={() => {
                checkNearBottom();
                // Detect user scrolling up during streaming
                const el = scrollContainerRef.current;
                if (el) {
                  const isStreaming = messages.some(m => m.isStreaming);
                  if (isStreaming && !isNearBottomRef.current) {
                    setUserScrolledUp(true);
                  }
                }
              }}
              className="w-full max-w-2xl flex-1 min-h-0 overflow-y-auto mb-4 space-y-4 py-4"
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  {/* Routing pill */}
                  {msg.role === "assistant" && msg.routingPill && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-1 rounded-full text-[10px] font-medium text-white/50"
                      style={{ background: "rgba(244,168,61,0.08)", border: "1px solid rgba(244,168,61,0.15)" }}>
                      {msg.routingPill.tier}
                    </span>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-3 text-sm ${
                      msg.role === "user" ? "text-right" : ""
                    }`}
                    style={{
                      color: msg.role === "user"
                        ? "rgba(224, 176, 100, 0.85)"
                        : "#ffffff",
                      background: msg.role === "assistant"
                        ? "rgba(255,255,255,0.03)"
                        : "transparent",
                      borderRadius: "12px",
                    }}
                  >
                    {renderMessageContent(msg)}
                    {msg.metadata && (msg.metadata as any).attachments && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {((msg.metadata as any).attachments as { name: string; type: string }[]).map((a, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white/60 border border-white/10">
                            <Paperclip className="w-3 h-3" />
                            {a.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {msg.metadata && (msg.metadata as any).audio_path && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-white/30">
                        <AudioLines className="w-3 h-3" />
                        Voice ({(msg.metadata as any).language || "?"})
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-4 py-3 text-sm text-white/60">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {intent === "search" ? "Searching yangu…" : "Thinking…"}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Jump to latest button */}
            {userScrolledUp && hasMessages && (
              <button
                onClick={jumpToLatest}
                className="mb-2 px-3 py-1 rounded-full text-xs font-medium text-white/70 hover:text-white transition-colors"
                style={{ background: "rgba(244,168,61,0.15)", border: "1px solid rgba(244,168,61,0.25)" }}
              >
                ↓ Jump to latest
              </button>
            )}

            {/* Skill Meter */}
            <div className="w-full max-w-2xl mb-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Mode segmented */}
                <div className="inline-flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                  {(["auto", "standard", "cinema", "motion"] as AdaMode[]).map(m => (
                    <button key={m} onClick={() => updateMode(m)}
                      className={`px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${adaMode === m ? "text-[#F4A83D] bg-[#F4A83D]/10" : "text-white/35 hover:text-white/60"}`}
                    >{m === "motion" ? "Motion Pro" : m}</button>
                  ))}
                </div>
                {/* Skill dropdown */}
                <select value={adaSkill} onChange={e => updateSkill(e.target.value as AdaSkill)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-white/50 outline-none capitalize cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <option value="starter">Starter</option>
                  <option value="creator">Creator</option>
                  <option value="agency">Agency</option>
                </select>
              </div>
            </div>

            {/* Input area */}
            <div className="w-full max-w-2xl mb-8">
              {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {pendingAttachments.map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white/60 bg-white/5 border border-white/10">
                      <Paperclip className="w-3 h-3" />
                      {a.name}
                      <button onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-white/30 hover:text-white/60 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative rounded-2xl p-4 transition-colors duration-500" style={{ background: "#050A07", border: "1px solid rgba(255,255,255,0.1)" }}>
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => {}}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={placeholder}
                  rows={1}
                  className="w-full bg-transparent text-white/90 text-sm placeholder:text-white/30 resize-none outline-none mb-3"
                />
                <div className="flex items-center justify-between">
                  <button onClick={handleAttachClick} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIntent(prev => prev === "search" ? null : "search")}
                      className={`px-2 py-1 text-xs font-medium transition-colors ${intent === "search" ? "text-[#F4A83D]" : "text-white/30 hover:text-white/50"}`}
                    >
                      Search
                    </button>
                    <button
                      onClick={() => setIntent(prev => prev === "discuss" ? null : "discuss")}
                      className={`px-2 py-1 text-xs font-medium transition-colors ${intent === "discuss" ? "text-[#F4A83D]" : "text-white/30 hover:text-white/50"}`}
                    >
                      Discuss
                    </button>
                    <button onClick={startVoice} className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                      <AudioLines className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleSend()}
                      disabled={!inputValue.trim() && pendingAttachments.length === 0}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                      style={{ background: (inputValue.trim() || pendingAttachments.length > 0) ? "linear-gradient(135deg, #D4952B, #F4A83D)" : "rgba(255,255,255,0.1)" }}
                    >
                      <ArrowUp className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Welcome / hero state */}
            <img src={adaLogo} alt="Ada AI" className="h-10 mb-4 object-contain" />
            <h1 className="text-white text-4xl md:text-5xl font-bold text-center mb-2 flex items-center justify-center gap-3">
              <span>Build your</span>
              <span className="inline-flex" style={{ minWidth: "4.5em" }}>
                <span className="text-[#F4A83D]">
                  {displayText}!
                </span>
              </span>
            </h1>
            {isAuthenticated && profile?.display_name && (
              <p className="text-white/40 text-2xl md:text-3xl font-light text-center mb-10">
                {profile.display_name}
              </p>
            )}
            {(!isAuthenticated || !profile?.display_name) && (
              <div className="mb-10" />
            )}

            {/* Skill Meter (hero) */}
            <div className="w-full max-w-2xl mb-3">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="inline-flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                  {(["auto", "standard", "cinema", "motion"] as AdaMode[]).map(m => (
                    <button key={m} onClick={() => updateMode(m)}
                      className={`px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${adaMode === m ? "text-[#F4A83D] bg-[#F4A83D]/10" : "text-white/35 hover:text-white/60"}`}
                    >{m === "motion" ? "Motion Pro" : m}</button>
                  ))}
                </div>
                <select value={adaSkill} onChange={e => updateSkill(e.target.value as AdaSkill)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-white/50 outline-none capitalize cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <option value="starter">Starter</option>
                  <option value="creator">Creator</option>
                  <option value="agency">Agency</option>
                </select>
              </div>
            </div>

            {/* Chat input box */}
            <div className="w-full max-w-2xl mb-8">
              {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {pendingAttachments.map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white/60 bg-white/5 border border-white/10">
                      <Paperclip className="w-3 h-3" />
                      {a.name}
                      <button onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-white/30 hover:text-white/60 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Dev mode indicator */}
              {import.meta.env.DEV && forcedMode && (
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded text-white/40" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    MODE: {forcedMode.toUpperCase()}
                  </span>
                  <button onClick={() => setForcedMode(null)} className="text-white/20 hover:text-white/50 text-[9px]">✕</button>
                </div>
              )}
              <div ref={boxRef} className="relative rounded-2xl outline-none ring-0 [&_*]:focus-visible:outline-none">
                <div className="relative rounded-2xl p-4 outline-none ring-0 focus-within:outline-none" style={{ background: "#050A07", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => { setIsFocused(true); }}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={placeholder}
                    rows={2}
                    className="w-full bg-transparent text-white/90 text-sm placeholder:text-white/30 resize-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <button onClick={handleAttachClick} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIntent(prev => prev === "search" ? null : "search")}
                        className={`px-2 py-1 text-xs font-medium transition-colors ${intent === "search" ? "text-[#F4A83D]" : "text-white/30 hover:text-white/50"}`}
                      >
                        Search
                      </button>
                      <button
                        onClick={() => setIntent(prev => prev === "discuss" ? null : "discuss")}
                        className={`px-2 py-1 text-xs font-medium transition-colors ${intent === "discuss" ? "text-[#F4A83D]" : "text-white/30 hover:text-white/50"}`}
                      >
                        Discuss
                      </button>
                      <button
                        onClick={startVoice}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
                      >
                        <AudioLines className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleSend()}
                        disabled={!inputValue.trim() && pendingAttachments.length === 0}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                        style={{ background: (inputValue.trim() || pendingAttachments.length > 0) ? "linear-gradient(135deg, #D4952B, #F4A83D)" : "rgba(255,255,255,0.1)" }}
                      >
                        <ArrowUp className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Quick Actions Panel ── */}
        {!hasMessages && (
          <div className="w-full max-w-2xl mb-4 animate-in fade-in duration-500">
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { label: "Generate Image", icon: Image, mode: "image" as const, prompt: "Generate an image of a modern brand visual — describe your product or concept here" },
                { label: "Plan Product", icon: Package, mode: "text" as const, prompt: "Help me plan a product. Here's what I'm building:\n\n• Product name: \n• Target audience: \n• Core value proposition: \n• Pricing model: \n• Distribution channels: " },
                { label: "Create Campaign", icon: Megaphone, mode: "text" as const, prompt: "Help me create an ad campaign plan:\n\n• Campaign goal: \n• Target audience: \n• Key message/hook: \n• Platforms: \n• Budget range: \n\nInclude creative angles, hooks, and a content checklist." },
                { label: "Build Community", icon: Users, mode: "text" as const, prompt: "Help me build a community strategy:\n\n• Community purpose: \n• Target members: \n• Content posting cadence: \n• Engagement tactics: \n• Offers/incentives: " },
                { label: "Optimize Profile", icon: UserCheck, mode: "text" as const, prompt: "Help me optimize my profile:\n\n• Current bio: \n• What I offer: \n• Target audience: \n\nSuggest improvements for my headline, bio, offers section, and CTA." },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => {
                      setForcedMode(action.mode);
                      setInputValue(action.prompt);
                      textareaRef.current?.focus();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-[#F4A83D] transition-all duration-200 hover:scale-[1.03]"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Connected Modules Panel ── */}
        {!hasMessages && (
          <div className="w-full max-w-2xl mb-4 animate-in fade-in duration-700 delay-150">
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { label: "Studio", connected: true },
                { label: "Community", connected: true },
                { label: "Dashboard", connected: true },
                { label: "Live", connected: false },
              ].map((mod) => (
                <span
                  key={mod.label}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
                  style={{
                    color: mod.connected ? "rgba(244,168,61,0.7)" : "rgba(255,255,255,0.25)",
                    background: mod.connected ? "rgba(244,168,61,0.06)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${mod.connected ? "rgba(244,168,61,0.12)" : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${mod.connected ? "bg-[#F4A83D]/60" : "bg-white/15"}`} />
                  {mod.connected ? "Connected" : "Coming"} • {mod.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Active Tasks Panel (appears during conversation) ── */}
        {hasMessages && activeTasks.length > 0 && (
          <div className="w-full max-w-2xl mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-3.5 h-3.5 text-[#F4A83D]/60" />
              <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">Active Tasks</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeTasks.map((task, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/60 animate-in fade-in duration-300"
                  style={{
                    background: "rgba(244,168,61,0.04)",
                    border: "1px solid rgba(244,168,61,0.1)",
                    animationDelay: `${i * 100}ms`,
                  }}
                >
                  <Zap className="w-3 h-3 text-[#F4A83D]/50" />
                  {task}
                </span>
              ))}
            </div>
            {sessionGoal && (
              <p className="text-[10px] text-white/25 mt-2 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[#F4A83D]/40" />
                Session goal: {sessionGoal}
              </p>
            )}
          </div>
        )}

        {/* ── Suggested Next Action (during conversation) ── */}
        {hasMessages && suggestedNextAction && (
          <div className="w-full max-w-2xl mb-2 animate-in fade-in duration-300">
            <button
              onClick={() => {
                setInputValue(suggestedNextAction);
                textareaRef.current?.focus();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#F4A83D]/70 hover:text-[#F4A83D] transition-all"
              style={{ background: "rgba(244,168,61,0.05)", border: "1px solid rgba(244,168,61,0.1)" }}
            >
              <Zap className="w-3 h-3" />
              💡 {suggestedNextAction}
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-white/25 text-xs text-center max-w-md mb-6">
          Don't enter sensitive info. AI responses may be inaccurate and do not
          represent views.
        </p>
      </div>

      {/* ── Bottom Section: ALL CHAT + IMAGES + Icons ── */}
      {!hideBottomSection && <AdaBottomSection />}

      {/* Advanced Prompt Modal */}
      {showAdvancedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAdvancedModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#F4A83D]" />
                <h3 className="text-white font-semibold">Advanced Mode</h3>
              </div>
              <button onClick={() => setShowAdvancedModal(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-white/50 text-xs">Provider</span>
                <select
                  value={selectedProvider}
                  onChange={e => updateProvider(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm text-white/80 outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <option value="openai">OpenAI (Reasoning / Chat)</option>
                  <option value="ideogram">Ideogram (Images)</option>
                  <option value="qwen">Qwen (Images)</option>
                  <option value="creatify">Creatify (Video)</option>
                </select>
              </label>
              <label className="block">
                <span className="text-white/50 text-xs">Aspect Ratio</span>
                <select
                  value={selectedAspectRatio}
                  onChange={e => updateAspectRatio(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm text-white/80 outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <option value="1:1">1:1</option>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="4:3">4:3</option>
                </select>
              </label>
              <label className="block">
                <span className="text-white/50 text-xs">Raw Params (JSON)</span>
                <textarea
                  rows={3}
                  value={advancedParams}
                  onChange={e => updateAdvancedParams(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm text-white/60 font-mono outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                  placeholder='{"style_type": "realistic"}'
                />
              </label>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-white/30 flex-1">
                Chat defaults to OpenAI • /image uses {selectedProvider === "ideogram" || selectedProvider === "qwen" ? selectedProvider : "Ideogram"} • /video uses Creatify
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${selectedProvider === "openai" ? "text-emerald-400 bg-emerald-400/10" : "text-[#F4A83D] bg-[#F4A83D]/10"}`}>
                {selectedProvider === "openai" ? "Reasoning" : selectedProvider === "creatify" ? "Video" : "Image"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Styles Drawer */}
      {showStylesDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setShowStylesDrawer(false)}>
          <div className="w-80 h-full overflow-y-auto p-6 space-y-4" style={{ background: "#0a0a0a", borderLeft: "1px solid rgba(255,255,255,0.08)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#F4A83D]" />
                <h3 className="text-white font-semibold">Preset Styles</h3>
              </div>
              <button onClick={() => setShowStylesDrawer(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {["Photorealistic", "Digital Art", "Watercolor", "3D Render", "Minimalist", "Anime", "Sketch"].map(style => (
              <button
                key={style}
                onClick={() => { setInputValue(prev => prev ? `${prev}, ${style.toLowerCase()} style` : `/image ${style.toLowerCase()} style `); setShowStylesDrawer(false); }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History Drawer */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setShowHistoryDrawer(false)}>
          <div className="w-96 h-full overflow-y-auto p-6 space-y-4" style={{ background: "#0a0a0a", borderLeft: "1px solid rgba(255,255,255,0.08)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#F4A83D]" />
                <h3 className="text-white font-semibold">Generation History</h3>
              </div>
              <button onClick={() => setShowHistoryDrawer(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {messages.filter(m => m.mediaGen).length === 0 ? (
              <p className="text-white/30 text-sm">No generations yet in this session.</p>
            ) : (
              messages.filter(m => m.mediaGen).map(m => (
                <div key={m.id} className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50 capitalize">{m.mediaGen!.kind} • {m.mediaGen!.status}</span>
                    <span className="text-xs text-white/30">{new Date(m.created_at).toLocaleTimeString()}</span>
                  </div>
                  {m.mediaGen!.caption && <p className="text-sm text-white/60 truncate">{m.mediaGen!.caption}</p>}
                  {m.mediaGen!.previewUrl && (
                    <div className="flex items-center gap-2">
                      <a href={m.mediaGen!.previewUrl} download target="_blank" rel="noopener noreferrer" className="text-xs text-[#F4A83D] hover:underline flex items-center gap-1">
                        <Download className="w-3 h-3" /> Download
                      </a>
                      <button onClick={() => { if (m.mediaGen?.retryPrompt && m.mediaGen?.retryCid) handleRetryMedia(m); }} className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Google Drive connect modal */}
      <DriveConnectModal open={showDriveConnect} onOpenChange={setShowDriveConnect} />

      {/* In-place auth modal */}
      <AdaAuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={() => {
          localStorage.removeItem(GUEST_USED_KEY);
          setGuestUsed(false);
        }}
      />
      {/* Quota reached modal */}
      <QuotaReachedModal
        open={!!quotaPopup}
        onClose={() => setQuotaPopup(null)}
        used={quotaPopup?.used ?? 0}
        limit={quotaPopup?.limit ?? 0}
        nextResetAt={quotaPopup?.nextResetAt ?? null}
        tier={quotaPopup?.tier ?? "free"}
      />
    </main>
  );
}
