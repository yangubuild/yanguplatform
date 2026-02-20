import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Info,
  Sparkles,
  PenLine,
  Users,
  Sparkle,
  Shield,
  X,
  ChevronRight,
  Compass,
  Youtube,
  Twitter,
  Instagram,
} from "lucide-react";
import yanguLogo from "@/assets/yangu-logo-full.png";
import adaIcon from "@/assets/ada-icon.png";

const topNavItems = [
  { icon: Home, label: "Explore", id: "explore" },
  { icon: Info, label: "Discover Yangu", id: "discover" },
  { icon: Sparkles, label: "Why Yangu", id: "why-yangu" },
];

const bottomNavItems = [
  { icon: null, customIcon: adaIcon, label: "Ada ai", id: "ada-ai" },
  { icon: PenLine, label: "Blog", id: "blog" },
  { icon: Users, label: "Community", id: "community" },
  { icon: Sparkle, label: "Affiliates", id: "affiliates" },
  { icon: Info, label: "Terms of Service", id: "terms" },
  { icon: Shield, label: "Privacy Policy", id: "privacy" },
];

interface MassSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function MassSidebar({ isOpen = true, onClose }: MassSidebarProps) {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("explore");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const renderNavItem = (item: { icon: typeof Home | null; customIcon?: string; label: string; id: string; isActive?: boolean }) => {
    const Icon = item.icon;
    const isActive = activeItem === item.id;
    const isHovered = hoveredItem === item.id;
    const showArrow = isHovered && !isActive;
    
    return (
      <button
        key={item.id}
        onClick={() => {
          setActiveItem(item.id);
          if (item.id === "community") navigate("/community");
          if (item.id === "ada-ai") navigate("/ada");
          if (item.id === "why-yangu") navigate("/why-yangu");
          if (item.id === "explore") navigate("/");
          if (item.id === "discover") navigate("/discover");
          if (item.id === "blog") navigate("/blog");
          if (item.id === "terms") navigate("/terms");
          if (item.id === "privacy") navigate("/privacy");
        }}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
        className="relative w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm transition-all mb-1"
        style={isActive ? {
          background: 'linear-gradient(90deg, #296048 0%, #174638 55%, rgba(10,23,16,0.18) 100%)',
          boxShadow: '0 0 18px rgba(41,96,72,0.18)',
          color: '#FFFFFF',
        } : isHovered ? {
          background: 'rgba(21,38,31,0.22)',
          color: 'rgba(255,255,255,0.85)',
        } : {
          background: 'transparent',
          color: 'rgba(255,255,255,0.65)',
        }}
      >
        <div className="flex items-center gap-3">
          {item.customIcon ? (
            <img 
              src={item.customIcon} 
              alt={item.label} 
              className="w-5 h-5" 
              style={{ filter: 'brightness(0) invert(1) opacity(0.65)' }}
            />
          ) : Icon ? (
            <Icon className="w-4 h-4" strokeWidth={1.5} />
          ) : null}
          <span className="font-normal">{item.label}</span>
        </div>
        {showArrow && (
          <ChevronRight className="w-4 h-4 text-white/30" />
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside
        className={`fixed left-0 top-0 h-screen w-[240px] flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: 'transparent',
        }}
      >
        
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="p-5 pb-6 pl-7">
          <img src={yanguLogo} alt="Yangu" className="h-12 w-auto" />
        </div>

        {/* Navigation */}
        <nav className="px-5 overflow-y-auto">
          {/* Top nav group */}
          {topNavItems.map(renderNavItem)}
          
          {/* Spacer between groups */}
          <div className="h-8" />
          
          {/* Bottom nav group */}
          {bottomNavItems.map(renderNavItem)}
          
          {/* Social icons */}
          <div className="px-4 pt-6 flex items-center gap-4">
            <a href="#" className="text-white/40 hover:text-white/70 transition-colors">
              <Youtube className="w-5 h-5" />
            </a>
            <a href="#" className="text-white/40 hover:text-white/70 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-white/40 hover:text-white/70 transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </nav>
        
        {/* Spacer to push content up */}
        <div className="flex-1" />
      </aside>
    </>
  );
}
