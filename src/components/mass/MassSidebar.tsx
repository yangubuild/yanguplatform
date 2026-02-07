import { useState } from "react";
import {
  Compass,
  Sparkles,
  HelpCircle,
  Bot,
  FileText,
  Users,
  Heart,
  ScrollText,
  Shield,
  X,
} from "lucide-react";
import { Youtube, Twitter, Instagram } from "lucide-react";
import yanguLogo from "@/assets/yangu-logo.png";

const navItems = [
  { icon: Compass, label: "Explore", active: true },
  { icon: Sparkles, label: "Discover Yangu", active: false },
  { icon: HelpCircle, label: "Why Yangu", active: false },
  { icon: Bot, label: "Ada ai", active: false },
  { icon: FileText, label: "Blog", active: false },
  { icon: Users, label: "Community", active: false },
  { icon: Heart, label: "Affiliates", active: false },
  { icon: ScrollText, label: "Terms", active: false },
  { icon: Shield, label: "Privacy", active: false },
];

interface MassSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function MassSidebar({ isOpen = true, onClose }: MassSidebarProps) {
  const [activeItem, setActiveItem] = useState("Explore");

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
        className={`fixed left-0 top-0 h-screen w-[220px] bg-[#0f0f0f] border-r border-[#1a1a1a] flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#666666] hover:text-white lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="p-6">
          <img 
            src={yanguLogo} 
            alt="Yangu" 
            className="h-10 w-auto"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.label;
            return (
              <button
                key={item.label}
                onClick={() => setActiveItem(item.label)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors mb-1 ${
                  isActive
                    ? "bg-[#1f1f1f] text-white"
                    : "text-[#666666] hover:text-white hover:bg-[#1a1a1a]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Social icons */}
        <div className="px-6 py-4 flex items-center gap-4">
          <a href="#" className="text-[#666666] hover:text-white transition-colors">
            <Youtube className="w-5 h-5" />
          </a>
          <a href="#" className="text-[#666666] hover:text-white transition-colors">
            <Twitter className="w-5 h-5" />
          </a>
          <a href="#" className="text-[#666666] hover:text-white transition-colors">
            <Instagram className="w-5 h-5" />
          </a>
        </div>

        {/* Endorsed badge */}
        <div className="p-4 m-3 rounded-xl bg-[#1a1a1a]">
          <div className="text-[#666666] text-xs mb-2">Endorsed by</div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#f97316] flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="text-white font-medium">Plaiter</span>
          </div>
        </div>
      </aside>
    </>
  );
}
