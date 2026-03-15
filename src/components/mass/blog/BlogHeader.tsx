import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import yanguLogoFull from "@/assets/yangu-logo-full.png";

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
        className="mx-auto flex items-center justify-between px-6 py-4"
        style={{ maxWidth: 1100 }}
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

        {/* Right: sign in + subscribe */}
        <div className="flex items-center gap-3">
          <button
            className="px-5 py-2.5 text-base md:text-lg font-semibold transition-all hover:brightness-110"
            style={{
              background: "#152A20",
              border: "1px solid #152A20",
              borderRadius: 12,
              color: "#FFFFFF",
            }}
          >
            Sign in
          </button>
          <button
            onClick={onSubscribeClick}
            className="px-5 py-2.5 text-base md:text-lg font-semibold transition-all hover:brightness-110"
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