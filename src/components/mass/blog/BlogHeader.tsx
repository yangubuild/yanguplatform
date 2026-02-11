import { useState } from "react";
import { Menu, Search, X } from "lucide-react";

interface BlogHeaderProps {
  onSubscribeClick: () => void;
}

export function BlogHeader({ onSubscribeClick }: BlogHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: "#000000",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: 1100 }}>
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button className="text-white/70 hover:text-white transition-colors" aria-label="Search">
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-5">
          <button className="text-white/70 hover:text-white text-sm transition-colors">
            Sign in
          </button>
          <button
            onClick={onSubscribeClick}
            className="rounded-full px-5 py-2 text-sm font-medium transition-all hover:brightness-110"
            style={{ background: "#C5F0E0", color: "#111" }}
          >
            Subscribe
          </button>
        </div>
      </div>
    </header>
  );
}
