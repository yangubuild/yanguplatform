import { useState, useRef, useEffect, useCallback } from "react";
import { X, Mic, Settings, ChevronDown, Smartphone, Plus, ArrowUp, AudioLines, User, Loader2 } from "lucide-react";
import adaLogo from "@/assets/ada-logo-full.png";
import { useAuth } from "@/hooks/useAuth";
import { useAdaVoice } from "@/hooks/useAdaVoice";
import { supabase } from "@/integrations/supabase/client";

export function AdaMainPanel() {
  const { user, profile, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [chatMode, setChatMode] = useState<"search" | "discuss" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const handleVoiceTranscript = useCallback(async (
    transcript: string,
    meta: { audio_path: string; language: string; duration_ms: number }
  ) => {
    // Set the transcript in the input and auto-send
    setMode("chat");
    setVoiceText("");

    if (!transcript.trim()) return;

    // Persist to ada_messages if authenticated
    if (isAuthenticated && user) {
      try {
        // Ensure we have a chat
        let cid = activeChatId;
        if (!cid) {
          const { data: chat } = await supabase
            .from("ada_chats")
            .insert({ user_id: user.id, title: transcript.slice(0, 60) })
            .select("id")
            .single();
          if (chat) {
            cid = chat.id;
            setActiveChatId(cid);
          }
        }

        if (cid) {
          await supabase.from("ada_messages").insert({
            chat_id: cid,
            role: "user",
            content: transcript,
            metadata: {
              audio_path: meta.audio_path,
              language: meta.language,
              duration_ms: meta.duration_ms,
            },
          });
        }
      } catch (err) {
        console.error("Failed to save voice message:", err);
      }
    }

    // Put transcript in input (the existing handleSend pipeline can be extended later)
    setInputValue(transcript);
  }, [isAuthenticated, user, activeChatId]);

  const { isRecording, isTranscribing, startRecording, stopRecording } = useAdaVoice({
    chatId: activeChatId,
    userId: user?.id ?? null,
    isAuthenticated,
    onTranscript: handleVoiceTranscript,
  });
  const [boxSize, setBoxSize] = useState({ w: 0, h: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const traceRef = useRef<SVGRectElement>(null);
  const glowRef = useRef<SVGRectElement>(null);

  // Track box dimensions for SVG border trace
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

  // Compute perimeter for stroke-dasharray
  const perim = boxSize.w && boxSize.h ? 2 * (boxSize.w + boxSize.h - 4 * 16) + 2 * Math.PI * 16 : 0;
  const dashLen = perim * 0.15;
  const gapLen = perim - dashLen;

  // Animate stroke-dashoffset via rAF for seamless border trace
  useEffect(() => {
    if (!perim) return;
    let raf: number;
    let start: number | null = null;
    const duration = 3000; // 3s per loop
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [inputValue]);

  const startVoice = () => {
    setMode("voice");
    setVoiceText("");
    startRecording();
  };

  const stopVoice = () => {
    stopRecording();
    // Mode will switch back to chat in handleVoiceTranscript
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    // placeholder – just clear for now
    setInputValue("");
  };

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
        // start erasing
        let i = currentWord.length;
        const eraseStep = () => {
          i--;
          if (i > 0) {
            setDisplayText(currentWord.slice(0, i));
            timeout = setTimeout(eraseStep, 45);
          } else {
            setDisplayText("");
            // pause with just "!" visible
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

  return (
    <main
      className="lg:ml-[280px] flex-1 min-h-screen flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse at 50% 100%, rgba(212,149,43,0.10) 0%, rgba(5,10,7,0) 60%), #050A07",
      }}
    >
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
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-white text-sm transition-all"
            style={{
              background: "linear-gradient(90deg, #C4841F 0%, rgba(212,149,43,0.45) 55%, rgba(10,10,10,0.18) 100%)",
              boxShadow: "0 0 18px rgba(212,149,43,0.18)",
            }}
          >
            <span className="text-[#F4A83D]">✦</span>
            Upgrade to Pro
          </button>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <User className="w-4 h-4 text-white/50" />
          </div>
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Welcome text */}
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
                onClick={stopVoice}
                className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={stopVoice}
                className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-500/20"
                style={{ background: "linear-gradient(135deg, #D4952B, #F4A83D)" }}
              >
                <ArrowUp className="w-6 h-6" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Chat input box */}
            <div className="w-full max-w-2xl mb-8">
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
                    {/* Glow layer */}
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
                  placeholder="Ask Ada to create something..."
                  rows={2}
                  className="w-full bg-transparent text-white/90 text-sm placeholder:text-white/30 resize-none outline-none mb-3"
                />
                <div className="flex items-center justify-between">
                  <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChatMode(chatMode === "search" ? null : "search")}
                      className={`px-2 py-1 text-xs font-medium transition-colors ${chatMode === "search" ? "text-[#F4A83D]" : "text-white/30 hover:text-white/50"}`}
                    >
                      Search
                    </button>
                    <button
                      onClick={() => setChatMode(chatMode === "discuss" ? null : "discuss")}
                      className={`px-2 py-1 text-xs font-medium transition-colors ${chatMode === "discuss" ? "text-[#F4A83D]" : "text-white/30 hover:text-white/50"}`}
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
                      onClick={handleSend}
                      disabled={!inputValue.trim()}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                      style={{ background: inputValue.trim() ? "linear-gradient(135deg, #D4952B, #F4A83D)" : "rgba(255,255,255,0.1)" }}
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
