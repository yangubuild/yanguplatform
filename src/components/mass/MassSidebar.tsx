import { useState } from "react";
import {
  Home,
  Info,
  Sparkles,
  Bot,
  Pencil,
  Users,
  Heart,
  Circle,
  CircleDot,
  X,
} from "lucide-react";
import { Youtube, Twitter, Instagram } from "lucide-react";
import yanguLogo from "@/assets/yangu-logo.png";

const topNavItems = [
  { icon: Home, label: "Explore", id: "explore" },
  { icon: Info, label: "Discover Yangu", id: "discover" },
  { icon: Sparkles, label: "Why Yangu", id: "why" },
];

const bottomNavItems = [
  { icon: Bot, label: "Ada ai", id: "ada" },
  { icon: Pencil, label: "Blog", id: "blog" },
  { icon: Users, label: "Community", id: "community" },
  { icon: Heart, label: "Affiliates", id: "affiliates" },
  { icon: Circle, label: "Terms", id: "terms" },
  { icon: CircleDot, label: "Privacy", id: "privacy" },
];

interface MassSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function MassSidebar({ isOpen = true, onClose }: MassSidebarProps) {
  const [activeItem, setActiveItem] = useState("why");

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
        className={`fixed left-0 top-0 h-screen w-[220px] bg-black flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="p-6">
          <img 
            src={yanguLogo} 
            alt="Yangu" 
            className="h-8 w-auto"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {/* Top nav group */}
          {topNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveItem(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors mb-1 ${
                  isActive
                    ? "text-white"
                    : "text-white/55 hover:text-white/80"
                }`}
                style={isActive ? {
                  background: 'rgba(36, 92, 68, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                } : undefined}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
          
          {/* Spacer between groups */}
          <div className="h-6" />
          
          {/* Bottom nav group */}
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveItem(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors mb-1 ${
                  isActive
                    ? "text-white"
                    : "text-white/55 hover:text-white/80"
                }`}
                style={isActive ? {
                  background: 'rgba(36, 92, 68, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                } : undefined}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Social icons */}
        <div className="px-6 py-4 flex items-center gap-4">
          <a href="#" className="text-white/40 hover:text-white transition-colors">
            <Youtube className="w-5 h-5" />
          </a>
          <a href="#" className="text-white/40 hover:text-white transition-colors">
            <Twitter className="w-5 h-5" />
          </a>
          <a href="#" className="text-white/40 hover:text-white transition-colors">
            <Instagram className="w-5 h-5" />
          </a>
        </div>

        {/* Endorsed badge */}
        <div className="p-4 m-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
          <div className="text-white/38 text-xs mb-2">Endorsed by</div>
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: '#F16612' }}
            >
              <span className="text-black text-xs font-bold">P</span>
            </div>
            <span className="text-white font-medium">Plaiter</span>
          </div>
        </div>
      </aside>
    </>
  );
}
