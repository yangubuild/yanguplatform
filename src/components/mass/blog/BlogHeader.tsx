import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import yanguLogo from "@/assets/yangu-logo-blog.png";
import yanguLogoFull from "@/assets/yangu-logo-full.png";

interface BlogHeaderProps {
  onSubscribeClick: () => void;
}

export function BlogHeader({ onSubscribeClick }: BlogHeaderProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: "#08120D",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div
        className="mx-auto grid items-center px-6 py-4"
        style={{
          maxWidth: 1100,
          gridTemplateColumns: "1fr auto 1fr",
        }}
      >
        {/* Left: search icon with expandable input */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Search"
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
          <div
            className="overflow-hidden transition-all duration-300 ease-out"
            style={{ width: searchOpen ? 220 : 0 }}
          >
            <input
              ref={searchRef}
              type="text"
              placeholder="Search…"
              className="w-[220px] bg-transparent border-b text-sm text-white/90 placeholder:text-white/40 outline-none py-1"
              style={{ borderColor: "rgba(255,255,255,0.2)" }}
              onBlur={() => setSearchOpen(false)}
            />
          </div>
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
          <div style={{ width: 80, height: 1, background: "rgba(255,255,255,0.2)" }} />
          <img src={yanguLogo} alt="yangu" className="h-6 w-auto px-4 cursor-pointer" onClick={() => navigate("/")} />
          <div style={{ width: 80, height: 1, background: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Right: sign in + subscribe */}
        <div className="flex items-center gap-3 justify-end">
          <button
            className="px-5 py-2.5 text-sm font-medium transition-all hover:brightness-110"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Sign in
          </button>
          <button
            onClick={onSubscribeClick}
            className="px-5 py-2.5 text-sm font-medium transition-all hover:brightness-110"
            style={{
              background: "linear-gradient(90deg, #b5622a, #5c2a12)",
              borderRadius: 12,
              color: "#fff",
            }}
          >
            Subscribe
          </button>
        </div>
      </div>
    </header>
  );
}
