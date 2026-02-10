import { useState } from "react";
import { X, Mic, Settings, ChevronDown, Copy, Smartphone } from "lucide-react";

export function AdaMainPanel() {
  const [inputValue, setInputValue] = useState(
    "Create a mystical, fantasy-style warrior standing on a cliff during sunset..."
  );
  const [isListening, setIsListening] = useState(true);

  return (
    <main
      className="lg:ml-[280px] flex-1 min-h-screen flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse at 50% 100%, rgba(244,109,42,0.10) 0%, rgba(14,14,14,0) 60%), #0e0e0e",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-sm font-medium">Lumix.AI</span>
          <ChevronDown className="w-3.5 h-3.5 text-white/40" />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-white/40 hover:text-white/70 rounded-lg border border-white/10">
            <Smartphone className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-white/50 text-sm hover:text-white/70">
            <Settings className="w-3.5 h-3.5" />
            Extensions
            <ChevronDown className="w-3 h-3" />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-white/50 text-sm hover:text-white/70">
            <span className="text-[#F46D2A]">✦</span>
            Upgrade to Pro
          </button>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600" />
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-10">
        {/* Welcome text */}
        <h1 className="text-white text-4xl md:text-5xl font-bold text-center mb-2">
          Welcome Back!
        </h1>
        <p className="text-white/40 text-2xl md:text-3xl font-light text-center mb-10">
          Alexandria Attaya
        </p>

        {/* Animated particle ring */}
        <div className="relative w-[280px] h-[280px] mb-10">
          <svg
            viewBox="0 0 280 280"
            className="w-full h-full animate-spin"
            style={{ animationDuration: "40s" }}
          >
            {/* Generate particle ring */}
            {Array.from({ length: 300 }).map((_, i) => {
              const angle = (i / 300) * Math.PI * 2;
              const radius = 100 + Math.random() * 30;
              const cx = 140 + Math.cos(angle) * radius;
              const cy = 140 + Math.sin(angle) * radius;
              const size = Math.random() * 3 + 1;
              const opacity = Math.random() * 0.7 + 0.3;
              return (
                <rect
                  key={i}
                  x={cx}
                  y={cy}
                  width={size}
                  height={size}
                  fill="white"
                  opacity={opacity}
                  rx={0.5}
                />
              );
            })}
          </svg>
        </div>

        {/* Prompt text */}
        <p className="text-white/70 text-center text-base md:text-lg max-w-md mb-2 leading-relaxed">
          Create a mystical, fantasy-style warrior
          <br />
          standing on a cliff during{" "}
          <span className="text-[#F46D2A]">sunset</span>...
        </p>

        {/* Listening indicator */}
        <p className="text-white/40 text-sm mb-6">Listening...</p>

        {/* Voice controls */}
        <div className="flex items-center gap-4 mb-8">
          <button className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white/70 hover:border-white/30 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <button
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/20"
            style={{ background: "#F46D2A" }}
          >
            <Mic className="w-6 h-6" />
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-white/25 text-xs text-center max-w-md">
          Don't enter sensitive info. AI responses may be inaccurate and do not
          represent views.
        </p>
      </div>
    </main>
  );
}
