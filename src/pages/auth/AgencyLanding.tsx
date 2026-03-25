import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import yanguLogo from "@/assets/yangu-agency-logo.png";
import heroShape from "@/assets/agency-hero-shape.png";
import yanguCoin from "@/assets/yangu-coin.png";

export default function AgencyLanding() {
  const coin1Ref = useRef<HTMLImageElement>(null);
  const coin2Ref = useRef<HTMLImageElement>(null);
  const heroRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let frame: number;
    const duration = 20000; // 20s full crossing
    let startTime: number | null = null;

    // Hero shape: slow drift from center-right to center-left then loops
    const animateHero = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Hero drifts across the viewport continuously
      if (heroRef.current) {
        // Moves from 110% (off right) to -40% (off left) over duration, then resets
        const progress = (elapsed % (duration * 1.5)) / (duration * 1.5);
        const xPercent = 110 - progress * 150; // 110 → -40
        const yFloat = Math.sin(progress * Math.PI * 2) * 15;
        heroRef.current.style.transform = `translate(${xPercent}vw, ${yFloat}px)`;
        heroRef.current.style.left = "0";
      }

      frame = requestAnimationFrame(animateHero);
    };

    frame = requestAnimationFrame(animateHero);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Separate animation for coins — luxury slow drift
  useEffect(() => {
    let frame: number;
    let t = 0;

    const animateCoins = () => {
      t += 0.002;

      if (coin1Ref.current) {
        // Coin 1: slow elegant orbit
        const x1 = Math.sin(t * 0.5) * 20 + Math.cos(t * 0.3) * 10;
        const y1 = Math.cos(t * 0.4) * 15 + Math.sin(t * 0.6) * 8;
        const r1 = Math.sin(t * 0.3) * 12;
        coin1Ref.current.style.transform = `translate(${x1}px, ${y1}px) rotate(${r1}deg)`;
      }

      if (coin2Ref.current) {
        const x2 = Math.cos(t * 0.4) * 18 - Math.sin(t * 0.5) * 12;
        const y2 = Math.sin(t * 0.3) * 16 + Math.cos(t * 0.5) * 10;
        const r2 = Math.cos(t * 0.25) * 15;
        coin2Ref.current.style.transform = `translate(${x2}px, ${y2}px) rotate(${r2}deg)`;
      }

      frame = requestAnimationFrame(animateCoins);
    };

    animateCoins();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="h-screen relative overflow-hidden flex flex-col"
      style={{ backgroundColor: "#08120D" }}
    >
      {/* Subtle atmospheric glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(41, 96, 72, 0.12) 0%, transparent 60%)",
        }}
      />

      {/* Navigation — vertically centered, well spaced */}
      <nav className="relative z-20 flex items-center justify-between px-8 sm:px-12 lg:px-20 h-20 sm:h-24 flex-shrink-0">
        {/* Left: Logo */}
        <img
          src={yanguLogo}
          alt="YANGU"
          className="h-10 w-10 sm:h-12 sm:w-12"
        />

        {/* Center: Title */}
        <h1
          className="absolute left-1/2 -translate-x-1/2 text-lg sm:text-xl md:text-2xl font-bold tracking-tight whitespace-nowrap"
          style={{ fontFamily: "Lufga, sans-serif", color: "hsl(0 0% 80%)" }}
        >
          Build for Agencies
        </h1>

        {/* Right: Login */}
        <Link
          to="/auth/login"
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110 border border-[hsl(24,60%,50%,0.25)]"
          style={{
            background: "linear-gradient(135deg, hsl(24, 60%, 50%), hsl(25, 70%, 38%))",
          }}
        >
          Login
        </Link>
      </nav>

      {/* Main hero area — the shape drifts across the screen */}
      <div className="relative z-10 flex-1 flex items-center justify-center overflow-hidden">
        <img
          ref={heroRef}
          src={heroShape}
          alt=""
          className="absolute h-[55vh] sm:h-[60vh] md:h-[65vh] max-h-[600px] w-auto select-none pointer-events-none"
          style={{
            filter: "drop-shadow(0 25px 80px rgba(0,0,0,0.5))",
            willChange: "transform",
          }}
        />
      </div>

      {/* Floating coins — proper aspect ratio, no stretching */}
      <img
        ref={coin1Ref}
        src={yanguCoin}
        alt=""
        className="absolute z-10 select-none pointer-events-none"
        style={{
          top: "25%",
          left: "8%",
          width: "52px",
          height: "52px",
          objectFit: "contain",
          opacity: 0.9,
          willChange: "transform",
        }}
      />
      <img
        ref={coin2Ref}
        src={yanguCoin}
        alt=""
        className="absolute z-10 select-none pointer-events-none"
        style={{
          bottom: "18%",
          right: "10%",
          width: "44px",
          height: "44px",
          objectFit: "contain",
          opacity: 0.85,
          willChange: "transform",
        }}
      />
    </div>
  );
}
