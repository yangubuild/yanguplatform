import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import yanguLogo from "@/assets/yangu-agency-logo.png";
import heroShape from "@/assets/agency-hero-shape.png";
import yanguCoin from "@/assets/yangu-coin.png";

export default function AgencyLanding() {
  const coin1Ref = useRef<HTMLImageElement>(null);
  const coin2Ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let frame: number;
    let t = 0;
    const animate = () => {
      t += 0.003;
      if (coin1Ref.current) {
        const x1 = Math.sin(t * 0.7) * 30 + Math.cos(t * 0.3) * 15;
        const y1 = Math.cos(t * 0.5) * 20 + Math.sin(t * 0.8) * 10;
        const r1 = Math.sin(t * 0.4) * 8;
        coin1Ref.current.style.transform = `translate(${x1}px, ${y1}px) rotate(${r1}deg)`;
      }
      if (coin2Ref.current) {
        const x2 = Math.cos(t * 0.5) * 25 - Math.sin(t * 0.6) * 18;
        const y2 = Math.sin(t * 0.4) * 22 + Math.cos(t * 0.7) * 12;
        const r2 = Math.cos(t * 0.3) * 10;
        coin2Ref.current.style.transform = `translate(${x2}px, ${y2}px) rotate(${r2}deg)`;
      }
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ backgroundColor: "#08120D" }}
    >
      {/* Atmospheric gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 40% 50%, rgba(41, 96, 72, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(21, 48, 36, 0.1) 0%, transparent 50%)",
        }}
      />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-6 sm:py-8">
        {/* Left: Logo */}
        <img src={yanguLogo} alt="YANGU" className="h-11 w-11 sm:h-14 sm:w-14" />

        {/* Center: Title */}
        <h1
          className="absolute left-1/2 -translate-x-1/2 text-xl sm:text-2xl md:text-3xl font-bold tracking-tight"
          style={{ fontFamily: "Lufga, sans-serif", color: "hsl(0 0% 85%)" }}
        >
          Build for Agencies
        </h1>

        {/* Right: Login */}
        <Link
          to="/auth/login"
          className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 border border-[hsl(24,60%,50%,0.3)]"
          style={{
            background: "linear-gradient(135deg, hsl(24, 60%, 50%), hsl(25, 70%, 35%))",
          }}
        >
          Login
        </Link>
      </nav>

      {/* Hero area */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        {/* Hero shape image */}
        <img
          src={heroShape}
          alt=""
          className="w-[80%] sm:w-[60%] md:w-[50%] lg:w-[45%] max-w-[700px] h-auto select-none"
          style={{ filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.5))" }}
        />
      </div>

      {/* Floating coins */}
      <img
        ref={coin1Ref}
        src={yanguCoin}
        alt=""
        className="absolute z-10 w-16 h-16 sm:w-20 sm:h-20 select-none pointer-events-none"
        style={{ top: "22%", left: "6%", opacity: 0.9 }}
      />
      <img
        ref={coin2Ref}
        src={yanguCoin}
        alt=""
        className="absolute z-10 w-14 h-14 sm:w-18 sm:h-18 select-none pointer-events-none"
        style={{ bottom: "15%", right: "8%", opacity: 0.85 }}
      />
    </div>
  );
}
