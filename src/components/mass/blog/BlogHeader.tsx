import { useState, useEffect } from "react";
import { Menu, Search, X } from "lucide-react";

interface BlogHeaderProps {
  onSubscribeClick: () => void;
}

export function BlogHeader({ onSubscribeClick }: BlogHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show small header logo once scrolled past the hero logo area
      setScrolled(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: "#000000",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div
        className="mx-auto grid items-center px-6 py-3"
        style={{
          maxWidth: 1100,
          gridTemplateColumns: "1fr auto 1fr",
        }}
      >
        {/* Left: menu + search */}
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

        {/* Center: small EVERY logo with divider lines, visible on scroll */}
        <div
          className="flex items-center gap-0 transition-all duration-200"
          style={{
            opacity: scrolled ? 1 : 0,
            transform: scrolled ? "translateY(0)" : "translateY(6px)",
            pointerEvents: scrolled ? "auto" : "none",
          }}
        >
          <div
            style={{
              width: 80,
              height: 1,
              background: "rgba(255,255,255,0.2)",
            }}
          />
          <span
            className="px-4 whitespace-nowrap select-none"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 18,
              fontWeight: 400,
              color: "#FFFFFF",
              letterSpacing: "0.15em",
            }}
          >
            EVERY
          </span>
          <div
            style={{
              width: 80,
              height: 1,
              background: "rgba(255,255,255,0.2)",
            }}
          />
        </div>

        {/* Right: sign in + subscribe */}
        <div className="flex items-center gap-5 justify-end">
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
