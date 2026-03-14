import { useState } from "react";
import { Plus, Mic, ArrowUp, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function LandingTestPromptArea() {
  const [mode, setMode] = useState<"build" | "explore">("build");
  const [inputValue, setInputValue] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    if (mode === "build") {
      navigate("/ada");
    } else {
      // search mode — future wiring
    }
  };

  return (
    <div className="flex flex-col items-center py-8 gap-6">
      {/* Toggle */}
      <div
        className="inline-flex items-center p-1.5"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
        }}
      >
        <button
          className="px-7 py-2.5 text-sm font-medium transition-all"
          style={mode === "build" ? {
            background: 'linear-gradient(135deg, #c47a3a 0%, #b5622a 50%, #5c2a12 100%)',
            color: '#fff',
            borderRadius: '10px',
          } : {
            background: 'transparent',
            color: 'rgba(255,255,255,0.45)',
            borderRadius: '10px',
          }}
          onClick={() => setMode("build")}
        >
          Build
        </button>
        <button
          className="px-7 py-2.5 text-sm font-medium transition-all"
          style={mode === "explore" ? {
            background: 'linear-gradient(135deg, #c47a3a 0%, #b5622a 50%, #5c2a12 100%)',
            color: '#fff',
            borderRadius: '10px',
          } : {
            background: 'transparent',
            color: 'rgba(255,255,255,0.45)',
            borderRadius: '10px',
          }}
          onClick={() => setMode("explore")}
        >
          Explore
        </button>
      </div>

      {/* BUILD mode = large AI chat bar */}
      {mode === "build" && (
        <div
          className="w-full max-w-[700px] rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="px-5 pt-5 pb-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Launch a custom emoji design shop..."
              className="w-full bg-transparent text-white placeholder:text-white/30 text-base focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between px-4 pb-4">
            <button className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Plus className="w-4 h-4 text-white/40" />
            </button>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Mic className="w-4 h-4 text-white/40" />
              </button>
              <button
                onClick={handleSubmit}
                className="w-9 h-9 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <ArrowUp className="w-4 h-4 text-white/40" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPLORE mode = slim search bar */}
      {mode === "explore" && (
        <div
          className="w-full max-w-[700px] flex items-center gap-3 px-5 py-3"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '999px',
          }}
        >
          <Search className="w-4 h-4 text-white/40 shrink-0" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="I'm looking for stock trading signals..."
            className="flex-1 bg-transparent text-white placeholder:text-white/30 text-sm focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            className="w-8 h-8 flex items-center justify-center rounded-full shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <ArrowUp className="w-4 h-4 text-white/40" />
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center justify-center gap-8 flex-wrap">
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <span className="font-semibold text-white/50">$2,770,949,959</span> earned
        </span>
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <span className="font-semibold text-white/50">22,277,339</span> users
        </span>
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <span className="font-semibold text-white/50">2,420,966</span> businesses
        </span>
      </div>
    </div>
  );
}
