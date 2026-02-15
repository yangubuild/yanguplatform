import { useState, useRef, useEffect, useCallback } from "react";
import { X, Mic, Settings, ChevronDown, Smartphone, Plus, ArrowUp, AudioLines, User, Loader2, Paperclip, Download, RefreshCw } from "lucide-react";
import adaLogo from "@/assets/ada-logo-full.png";
import { useAuth } from "@/hooks/useAuth";
import { useAdaVoice } from "@/hooks/useAdaVoice";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { generateIdeogramImage } from "@/lib/ai/ideogram";
import { generateQwenImage } from "@/lib/ai/qwen";
import { generateCreatifyVideo } from "@/lib/ai/creatify";
import { consumeEntitlement } from "@/lib/entitlements";
import { useNavigate } from "react-router-dom";
import { MediaGenerationCard, type MediaGenStatus } from "./MediaGenerationCard";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  // Streaming state
  isStreaming?: boolean;
  // Media generation state
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

// localStorage helpers for anonymous users
const ANON_CHATS_KEY = "ada_anon_chats";
const ANON_ACTIVE_KEY = "ada_anon_active_chat";

function getAnonChats(): { id: string; title: string; messages: ChatMessage[] }[] {
  try { return JSON.parse(localStorage.getItem(ANON_CHATS_KEY) || "[]"); } catch { return []; }
}
function saveAnonChats(chats: { id: string; title: string; messages: ChatMessage[] }[]) {
  localStorage.setItem(ANON_CHATS_KEY, JSON.stringify(chats));
}

// --- SSE stream parser (handles both custom {type:"token"} and OpenAI SSE) ---
async function readSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (text: string) => void,
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
        // Custom format: {type:"token", text:"..."}
        if (parsed.type === "token" && parsed.text) {
          onChunk(parsed.text);
        } else if (parsed.type === "done") {
          onDone(); return;
        }
        // Fallback: OpenAI SSE format
        else if (parsed.choices?.[0]?.delta?.content) {
          onChunk(parsed.choices[0].delta.content);
        }
      } catch { /* skip non-JSON lines */ }
    }
  }
  onDone();
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

export function AdaMainPanel() {
  const { user, profile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [intent, setIntent] = useState<"search" | "discuss" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<{ name: string; type: string; size: number; path: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Smart auto-scroll: only scroll if user is near bottom
  const isNearBottomRef = useRef(true);
  const checkNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 120;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  const smartScroll = useCallback(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Scroll when messages change (only if near bottom)
  useEffect(() => {
    smartScroll();
  }, [messages, isThinking, smartScroll]);

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
        // Fallback: try non-streaming
        const errData = await res.json().catch(() => null);
        const errorText = errData?.error || "I'm having trouble responding right now. Please try again.";
        if (errData?.error) toast({ title: errData.error, variant: "destructive" });
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: errorText, isStreaming: false } : m));
        await persistMessage(cid, { id: msgId, role: "assistant", content: errorText, created_at: new Date().toISOString() });
        return;
      }

      const reader = res.body.getReader();
      let fullContent = "";

      await readSSEStream(
        reader,
        (chunk) => {
          fullContent += chunk;
          const current = fullContent;
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: current } : m));
          smartScroll();
        },
        () => {
          // Mark as done
          const finalContent = fullContent || "I couldn't generate a response. Please try again.";
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: finalContent, isStreaming: false } : m));
          persistMessage(cid, { id: msgId, role: "assistant", content: finalContent, created_at: new Date().toISOString() });
        },
      );
    } catch (err) {
      console.error("[AdaStream] Error:", err);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: "I'm having trouble responding right now. Please try again.", isStreaming: false } : m));
    }
  }, [persistMessage, smartScroll]);

  // --- Image generation with progress card ---
  const handleImageGenerate = useCallback(async (prompt: string, cid: string, provider: "ideogram" | "qwen" = "ideogram") => {
    // Entitlement check
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
      // Update to generating
      setMessages(prev => prev.map(m => m.id === mediaMsgId ? { ...m, mediaGen: { ...m.mediaGen!, status: "generating" as MediaGenStatus, progressStep: "Generating…" } } : m));

      const result = provider === "qwen"
        ? await generateQwenImage(prompt)
        : await generateIdeogramImage(prompt);

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
    } catch (err) {
      console.error("[AdaImage] Error:", err);
      setMessages(prev => prev.map(m => m.id === mediaMsgId ? {
        ...m,
        mediaGen: { ...m.mediaGen!, status: "error" as MediaGenStatus, error: "Image generation failed. Please try again." },
      } : m));
    }
  }, [persistMessage]);

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
  }, [persistMessage]);

  // --- Retry media generation ---
  const handleRetryMedia = useCallback((msg: ChatMessage) => {
    if (!msg.mediaGen) return;
    const { retryPrompt, retryProvider, retryCid, kind } = msg.mediaGen;
    if (!retryPrompt || !retryCid) return;
    // Remove the failed card
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    if (kind === "image") {
      handleImageGenerate(retryPrompt, retryCid, (retryProvider as "ideogram" | "qwen") || "ideogram");
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

  // --- Send message ---
  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText || inputValue).trim();
    if (!text && pendingAttachments.length === 0) return;

    const currentIntent = intent;
    setIntent(null);

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

    // Route: /video command
    if (text.startsWith("/video ")) {
      const videoPrompt = text.slice(7).trim();
      if (videoPrompt) {
        await handleVideoGenerate(videoPrompt, cid);
      } else {
        const errMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: "assistant",
          content: "Please provide a prompt or URL after `/video`. Example: `/video https://myshop.com/product`",
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errMsg]);
        await persistMessage(cid, errMsg);
      }
    } else if (text.startsWith("/image:qwen ")) {
      const imagePrompt = text.slice(12).trim();
      if (imagePrompt) {
        await handleImageGenerate(imagePrompt, cid, "qwen");
      } else {
        const errMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: "assistant",
          content: "Please provide a prompt after `/image:qwen`. Example: `/image:qwen a sunset over mountains`",
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errMsg]);
        await persistMessage(cid, errMsg);
      }
    } else if (text.startsWith("/image ")) {
      const imagePrompt = text.slice(7).trim();
      if (imagePrompt) {
        await handleImageGenerate(imagePrompt, cid, "ideogram");
      } else {
        const errMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: "assistant",
          content: "Please provide a prompt after `/image`. Example: `/image a sunset over mountains`",
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errMsg]);
        await persistMessage(cid, errMsg);
      }
    } else if (currentIntent === "search" && text) {
      await handleSearch(text, cid);
    } else {
      // Auto-detect image intent
      const lowerText = text.toLowerCase();
      const imageIntentPatterns = [
        /^(generate|create|make|draw|design|paint|sketch)\s+(an?\s+)?image\b/,
        /^(generate|create|make|draw|design|paint|sketch)\s+(an?\s+)?(picture|photo|illustration|artwork|logo|icon|graphic|poster|banner)\b/,
        /\b(generate|create|make|draw)\s+(me\s+)?(an?\s+)?image\b/,
        /\bimage\s+of\b/,
        /\bpicture\s+of\b/,
      ];
      const isImageIntent = imageIntentPatterns.some(p => p.test(lowerText));

      if (isImageIntent) {
        const cleanPrompt = text
          .replace(/^(generate|create|make|draw|design|paint|sketch)\s+(me\s+)?(an?\s+)?(image|picture|photo|illustration|artwork|logo|icon|graphic|poster|banner)\s*(of\s+)?/i, "")
          .replace(/^(an?\s+)?(image|picture)\s+of\s+/i, "")
          .trim() || text;
        await handleImageGenerate(cleanPrompt, cid, "ideogram");
      } else {
        await handleDiscuss(text, cid);
      }
    }
  }, [inputValue, activeChatId, isAuthenticated, pendingAttachments, intent, createDbChat, createAnonChat, persistMessage, handleSearch, handleDiscuss, handleImageGenerate, handleVideoGenerate]);

  // --- Voice ---
  const handleVoiceTranscript = useCallback(async (
    transcript: string,
    meta: { audio_path: string; language: string; duration_ms: number; mime_type: string; size_bytes: number }
  ) => {
    setMode("chat");
    setVoiceText("");
    if (!transcript.trim()) return;

    let cid = activeChatId;
    if (!cid) {
      cid = isAuthenticated ? await createDbChat(transcript.slice(0, 60)) : createAnonChat(transcript.slice(0, 60));
      if (!cid) return;
      setActiveChatId(cid);
    }

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: transcript,
      metadata: {
        audio_path: meta.audio_path,
        language: meta.language,
        duration_ms: meta.duration_ms,
        mime_type: meta.mime_type,
        size_bytes: meta.size_bytes,
      },
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    await persistMessage(cid, userMsg);

    const currentIntent = intent;
    setIntent(null);

    if (currentIntent === "search" && transcript) {
      await handleSearch(transcript, cid);
    } else {
      await handleDiscuss(transcript, cid);
    }
  }, [activeChatId, isAuthenticated, intent, createDbChat, createAnonChat, persistMessage, handleSearch, handleDiscuss]);

  const { isRecording, isTranscribing, startRecording, stopRecording, cancelRecording } = useAdaVoice({
    chatId: activeChatId,
    userId: user?.id ?? null,
    isAuthenticated,
    onTranscript: handleVoiceTranscript,
  });

  // --- Attachments ---
  const handleAttachClick = useCallback(() => {
    if (!isAuthenticated) {
      toast({ title: "Login to use files", variant: "destructive" });
      return;
    }
    fileInputRef.current?.click();
  }, [isAuthenticated]);

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
      const filePath = `${user.id}/${cid}/${ts}-${file.name}`;
      const { error } = await supabase.storage.from("ada-uploads").upload(filePath, file, { upsert: false });
      if (error) {
        console.error("Upload err:", error);
        toast({ title: `Failed to upload ${file.name}`, variant: "destructive" });
        continue;
      }
      setPendingAttachments(prev => [...prev, { name: file.name, type: file.type, size: file.size, path: filePath }]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [user, activeChatId, createDbChat]);

  // --- Voice mode ---
  const startVoice = () => {
    if (!isAuthenticated) {
      toast({ title: "Login to use voice", variant: "destructive" });
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
        setMessages((data || []).map(m => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          metadata: m.metadata as Record<string, unknown> | undefined,
          created_at: m.created_at,
        })));
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

  const hasMessages = messages.length > 0;
  const placeholder = intent === "search"
    ? "Search YANGU (products, services, tools)…"
    : intent === "discuss"
    ? "Discuss with Ada…"
    : "Ask Ada…";

  // --- Render message content (text with optional streaming cursor) ---
  const renderMessageContent = (msg: ChatMessage) => {
    // Media generation card
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

    // Check for inline images (from loaded history)
    if (msg.content.match(/!\[.*?\]\(.*?\)/)) {
      return (
        <div>
          {msg.content.split(/(!?\[.*?\]\(.*?\))/).map((part, idx) => {
            const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
            if (imgMatch) {
              return (
                <div key={idx} className="relative inline-block">
                  <img
                    src={imgMatch[2]}
                    alt={imgMatch[1]}
                    className="rounded-lg max-w-full mt-2 mb-2"
                    style={{ maxHeight: "400px" }}
                  />
                  <a
                    href={imgMatch[2]}
                    download={`ada-image-${Date.now()}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-4 right-2 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors"
                    title="Download image"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              );
            }
            return part ? <span key={idx} style={{ whiteSpace: "pre-wrap" }}>{part}</span> : null;
          })}
        </div>
      );
    }

    // Text with streaming cursor
    return (
      <span style={{ whiteSpace: "pre-wrap" }}>
        {msg.content}
        {msg.isStreaming && (
          <span className="inline-block w-[2px] h-[1em] bg-[#F4A83D] ml-0.5 align-middle animate-pulse" />
        )}
      </span>
    );
  };

  return (
    <main
      className="lg:ml-[280px] flex-1 min-h-screen flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse at 50% 100%, rgba(212,149,43,0.10) 0%, rgba(5,10,7,0) 60%), #050A07",
      }}
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
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <img src={adaLogo} alt="Ada AI" className="h-8 w-auto" />
          <ChevronDown className="w-3.5 h-3.5 text-white/40" />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-white/40 hover:text-white/70 rounded-lg border border-white/10" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08))" }}>
            <Smartphone className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-white/50 text-sm hover:text-white/70" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08))" }}>
            <Settings className="w-3.5 h-3.5" />
            Extensions
            <ChevronDown className="w-3 h-3" />
          </button>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <User className="w-4 h-4 text-white/50" />
          </div>
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
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
              onScroll={checkNearBottom}
              className="w-full max-w-2xl flex-1 overflow-y-auto mb-4 space-y-4 py-4"
              style={{ maxHeight: "calc(100vh - 280px)" }}
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
                    {/* Attachment chips */}
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
                    {/* Audio metadata */}
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
                      {intent === "search" ? "Searching YANGU…" : "Thinking…"}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
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
              <div ref={boxRef} className="relative rounded-2xl">
                {perim > 0 && (
                  <>
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500"
                      style={{ opacity: isFocused || inputValue ? 0 : 1 }}
                    >
                      <rect
                        ref={traceRef}
                        x="0.5" y="0.5"
                        width={boxSize.w - 1} height={boxSize.h - 1}
                        rx="16" ry="16"
                        fill="none"
                        stroke="#F4A83D"
                        strokeWidth="2"
                        style={{ strokeDasharray: `${dashLen} ${gapLen}` }}
                      />
                    </svg>
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none blur-md transition-opacity duration-500"
                      style={{ opacity: isFocused || inputValue ? 0 : 0.6 }}
                    >
                      <rect
                        ref={glowRef}
                        x="0.5" y="0.5"
                        width={boxSize.w - 1} height={boxSize.h - 1}
                        rx="16" ry="16"
                        fill="none"
                        stroke="#F4A83D"
                        strokeWidth="4"
                        style={{ strokeDasharray: `${dashLen} ${gapLen}` }}
                      />
                    </svg>
                  </>
                )}
                <div className="relative rounded-2xl p-4 transition-colors duration-500" style={{ background: "#050A07", border: isFocused || inputValue ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent" }}>
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={placeholder}
                    rows={2}
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

        {/* Disclaimer */}
        <p className="text-white/25 text-xs text-center max-w-md">
          Don't enter sensitive info. AI responses may be inaccurate and do not
          represent views.
        </p>
      </div>
    </main>
  );
}
