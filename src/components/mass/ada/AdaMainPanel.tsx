import { useState, useRef, useEffect, useCallback } from "react";
import { X, Mic, Settings, ChevronDown, Smartphone, Plus, ArrowUp, AudioLines, User, Loader2, Paperclip } from "lucide-react";
import adaLogo from "@/assets/ada-logo-full.png";
import { useAuth } from "@/hooks/useAuth";
import { useAdaVoice } from "@/hooks/useAdaVoice";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { generateIdeogramImage } from "@/lib/ai/ideogram";
import { generateQwenImage } from "@/lib/ai/qwen";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
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

export function AdaMainPanel() {
  const { user, profile, isAuthenticated } = useAuth();
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // --- Chat session helpers ---
  const createDbChat = useCallback(async (firstMsg: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("ada_chats")
      .insert({ user_id: user.id, title: firstMsg.slice(0, 60) })
      .select("id")
      .single();
    if (error || !data) { console.error("create chat err", error); return null; }
    // Notify sidebar
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

  // --- Search mode: query knowledge tables + AI summarization ---
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

      // Build search context for AI
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

      // Call AI to summarize/present results
      const convMessages = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      convMessages.push({ role: "user", content: query });

      const { data: fnData, error: fnErr } = await supabase.functions.invoke("ada-chat", {
        body: { messages: convMessages, intent: "search", search_context: searchContext },
      });

      let content: string;
      if (fnErr || !fnData?.ok) {
        console.error("[AdaSearch] AI error:", fnErr, fnData);
        // Fallback to raw results
        content = found
          ? `**Search results for "${query}":**\n\n${searchContext}`
          : `No results found for "${query}". Try different keywords or switch to Discuss.`;
      } else {
        content = fnData.content;
      }

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      await persistMessage(cid, assistantMsg);
    } catch (err) {
      console.error("[AdaSearch] Error:", err);
      const errMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: "Search failed. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsThinking(false);
    }
  }, [persistMessage, messages]);

  // --- Image generation via /image command ---
  const handleImageGenerate = useCallback(async (prompt: string, cid: string, provider: "ideogram" | "qwen" = "ideogram") => {
    setIsThinking(true);
    try {
      const result = provider === "qwen"
        ? await generateQwenImage(prompt)
        : await generateIdeogramImage(prompt);

      let content: string;
      let metadata: Record<string, unknown> | undefined;

      if (!result.ok || !result.images || result.images.length === 0) {
        console.error(`[AdaImage] ${provider} error:`, result.error);
        content = result.error || "Image generation failed. Please try again.";
      } else {
        const img = result.images[0];
        const providerLabel = provider === "qwen" ? "Qwen" : "Ideogram";
        content = `![Generated image](${img.url})\n\n*Generated with ${providerLabel}*`;
        metadata = {
          type: "image",
          provider,
          storage_path: img.storage_path,
          generation_id: result.generation_id,
        };
      }

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content,
        metadata,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      await persistMessage(cid, assistantMsg);
    } catch (err) {
      console.error("[AdaImage] Error:", err);
      const errMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: "Image generation failed. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsThinking(false);
    }
  }, [persistMessage]);

  // --- Send message (text) ---
  // --- Discuss mode: call AI ---
  const handleDiscuss = useCallback(async (text: string, cid: string) => {
    setIsThinking(true);
    try {
      const convMessages = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      convMessages.push({ role: "user", content: text });

      const { data: fnData, error: fnErr } = await supabase.functions.invoke("ada-chat", {
        body: { messages: convMessages, intent: "discuss" },
      });

      let content: string;
      if (fnErr || !fnData?.ok) {
        console.error("[AdaDiscuss] AI error:", fnErr, fnData);
        if (fnData?.error) {
          toast({ title: fnData.error, variant: "destructive" });
        }
        content = "I'm having trouble responding right now. Please try again.";
      } else {
        content = fnData.content;
      }

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      await persistMessage(cid, assistantMsg);
    } catch (err) {
      console.error("[AdaDiscuss] Error:", err);
    } finally {
      setIsThinking(false);
    }
  }, [messages, persistMessage]);

  // --- Send message (text) ---
  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText || inputValue).trim();
    if (!text && pendingAttachments.length === 0) return;

    // Capture current intent and reset to neutral
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

    // Route: /image command takes priority
    if (text.startsWith("/image:qwen ")) {
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
      await handleDiscuss(text, cid);
    }
  }, [inputValue, activeChatId, isAuthenticated, pendingAttachments, intent, createDbChat, createAnonChat, persistMessage, handleSearch, handleDiscuss, handleImageGenerate]);

  // --- Voice ---
  const handleVoiceTranscript = useCallback(async (
    transcript: string,
    meta: { audio_path: string; language: string; duration_ms: number; mime_type: string; size_bytes: number }
  ) => {
    setMode("chat");
    setVoiceText("");
    if (!transcript.trim()) return;

    // Ensure chat session
    let cid = activeChatId;
    if (!cid) {
      cid = isAuthenticated ? await createDbChat(transcript.slice(0, 60)) : createAnonChat(transcript.slice(0, 60));
      if (!cid) return;
      setActiveChatId(cid);
    }

    // Insert transcript as user message with audio metadata
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

    // Capture current intent and reset
    const currentIntent = intent;
    setIntent(null);

    // Route by intent
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

  // --- New Chat (called from sidebar via window event) ---
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

  // --- Rotating words (existing) ---
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

      {/* Top bar — NO Upgrade button */}
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

            {/* Prompt text */}
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

            {/* Voice controls */}
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
            {/* Chat thread view — messages render directly on page bg */}
            <div className="w-full max-w-2xl flex-1 overflow-y-auto mb-4 space-y-4 py-4" style={{ maxHeight: "calc(100vh - 280px)" }}>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "text-right"
                        : ""
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
                    {/* Render inline images from markdown-style ![alt](url) */}
                    {msg.content.match(/!\[.*?\]\(.*?\)/) ? (
                      <div>
                        {msg.content.split(/(!?\[.*?\]\(.*?\))/).map((part, idx) => {
                          const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
                          if (imgMatch) {
                            return (
                              <img
                                key={idx}
                                src={imgMatch[2]}
                                alt={imgMatch[1]}
                                className="rounded-lg max-w-full mt-2 mb-2"
                                style={{ maxHeight: "400px" }}
                              />
                            );
                          }
                          return part ? <span key={idx} style={{ whiteSpace: "pre-wrap" }}>{part}</span> : null;
                        })}
                      </div>
                    ) : (
                      <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                    )}
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
                    {/* Audio metadata indicator */}
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

            {/* Input area (same design) */}
            <div className="w-full max-w-2xl mb-8">
              {/* Pending attachment chips */}
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
            {/* Welcome / hero state (existing design exactly) */}
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
              {/* Pending attachment chips */}
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
                {/* SVG border trace animation */}
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
