import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, Info, Sparkles, PenLine, Users, Sparkle, Shield, X, ChevronRight,
  Youtube, Twitter, Instagram, Code2, Blocks, Terminal,
} from "lucide-react";
import yanguLogo from "@/assets/yangu-logo-full.png";
import adaIcon from "@/assets/ada-icon.png";

const topNavItems = [
  { icon: Home, label: "Explore", id: "explore", route: "/landingtest" },
  { icon: Info, label: "Discover yangu", id: "discover", route: "/discover" },
  { icon: Sparkles, label: "Why yangu", id: "why-yangu", route: "/why-yangu" },
];

const bottomNavItems = [
  { icon: null as any, customIcon: adaIcon, label: "Ada ai", id: "ada-ai", route: "/ada" },
  { icon: PenLine, label: "Blog", id: "blog", route: "/blog" },
  { icon: Users, label: "Community", id: "community", route: "/community" },
  { icon: Sparkle, label: "Affiliates", id: "affiliates", route: "/dashboard/affiliates" },
  { icon: Info, label: "Terms of Service", id: "termsofservice", route: "/termsofservice" },
  { icon: Shield, label: "Privacy Policy", id: "privacypolicy", route: "/privacypolicy" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function LandingTestSidebar({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("explore");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleClick = (item: typeof topNavItems[0] | typeof bottomNavItems[0]) => {
    setActiveItem(item.id);
    if (item.id === "api") {
      // TODO: developer signup popup
      return;
    }
    if (item.route) navigate(item.route);
    onClose();
  };

  const renderNavItem = (item: any) => {
    const Icon = item.icon;
    const isActive = activeItem === item.id;
    const isHovered = hoveredItem === item.id;

    return (
      <button
        key={item.id}
        onClick={() => handleClick(item)}
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
            <img src={item.customIcon} alt={item.label} className="w-5 h-5" style={{ filter: 'brightness(0) invert(1) opacity(0.65)' }} />
          ) : Icon ? (
            <Icon className="w-4 h-4" strokeWidth={1.5} />
          ) : null}
          <span className="font-normal">{item.label}</span>
        </div>
        {isHovered && !isActive && <ChevronRight className="w-4 h-4 text-white/30" />}
      </button>
    );
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />}
      <aside
        className={`fixed left-0 top-0 h-screen w-[240px] flex flex-col z-50 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: '#08120D' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/40 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <div className="p-5 pb-6 pl-7">
          <img src={yanguLogo} alt="yangu" className="h-12 w-auto" />
        </div>
        <nav className="px-5 overflow-y-auto flex-1">
          {topNavItems.map(renderNavItem)}
          <div className="h-8" />
          {bottomNavItems.map(renderNavItem)}
          <div className="px-4 pt-6 flex items-center gap-4">
            <a href="#" className="text-white/40 hover:text-white/70 transition-colors"><Youtube className="w-5 h-5" /></a>
            <a href="#" className="text-white/40 hover:text-white/70 transition-colors"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="text-white/40 hover:text-white/70 transition-colors"><Instagram className="w-5 h-5" /></a>
          </div>
        </nav>
      </aside>
    </>
  );
}
