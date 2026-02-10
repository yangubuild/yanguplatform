import { useState, useRef, useEffect } from "react";
import { X, Mic, Settings, ChevronDown, Smartphone, Plus, ArrowUp, AudioLines, User } from "lucide-react";
import adaLogo from "@/assets/ada-logo-full.png";

export function AdaMainPanel() {
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [chatMode, setChatMode] = useState<"search" | "discuss" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [inputValue]);

  const startVoice = () => {
    setMode("voice");
    setVoiceText("Help me build a brand strategy for my online store and set up my first surface...");
  };

  const stopVoice = () => {
    setMode("chat");
    if (voiceText) {
      setInputValue(voiceText);
    }
    setVoiceText("");
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    // placeholder – just clear for now
    setInputValue("");
  };

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
        <h1 className="text-white text-4xl md:text-5xl font-bold text-center mb-2">
          Welcome Back!
        </h1>
        <p className="text-white/40 text-2xl md:text-3xl font-light text-center mb-10">
          Alexandria Attaya
        </p>

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
            <p className="text-white/40 text-sm mb-6">Listening...</p>

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
              <div className="relative rounded-2xl p-[1px] overflow-hidden">
                {/* Animated gradient border */}
                <div
                  className="absolute inset-0 rounded-2xl animate-spin"
                  style={{
                    background: "conic-gradient(from 0deg, transparent 0%, rgba(212,149,43,0.45) 25%, rgba(244,168,61,0.45) 40%, transparent 50%, transparent 75%, rgba(212,149,43,0.45) 90%, rgba(244,168,61,0.45) 100%)",
                    animationDuration: "8s",
                    animationTimingFunction: "linear",
                  }}
                />
                {/* Glow layer */}
                <div
                  className="absolute inset-0 rounded-2xl animate-spin blur-md opacity-30"
                  style={{
                    background: "conic-gradient(from 0deg, transparent 0%, #D4952B 25%, #F4A83D 40%, transparent 50%, transparent 75%, #D4952B 90%, #F4A83D 100%)",
                    animationDuration: "8s",
                    animationTimingFunction: "linear",
                  }}
                />
              <div className="relative rounded-2xl bg-[#050A07] p-4">
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
