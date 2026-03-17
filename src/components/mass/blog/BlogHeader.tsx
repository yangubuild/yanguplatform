import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import yanguLogo from "@/assets/yangu-logo-blog.png";
import yanguLogoFull from "@/assets/yangu-logo-full.png";
import { Button } from "@/components/ui/button";

interface BlogHeaderProps {
  onSubscribeClick: () => void;
}

export function BlogHeader({ onSubscribeClick }: BlogHeaderProps) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: "#08120D",
      }}
    >
      <div
        className="mx-auto grid items-center px-4 sm:px-6 lg:px-10 py-4 max-w-[1320px]"
        style={{
          gridTemplateColumns: "1fr auto 1fr",
        }}
      >
        {/* Left: yangu logo */}
        <div className="flex items-center">
          <img
            src={yanguLogoFull}
            alt="yangu"
            className="h-12 w-auto cursor-pointer"
            onClick={() => navigate("/")}
          />
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
          <Button
            variant="dark-green"
            size="default"
          >
            Sign in
          </Button>
          <Button
            variant="accent"
            size="default"
            onClick={onSubscribeClick}
          >
            Subscribe
          </Button>
        </div>
      </div>
    </header>
  );
}
