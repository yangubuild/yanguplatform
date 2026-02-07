import { useState } from "react";
import {
  Home,
  Info,
  Heart,
  Lightbulb,
  Code2,
  LayoutGrid,
  Sparkles,
  Type,
  PenTool,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", active: true },
  { icon: Info, label: "About Us", active: false },
  { icon: Heart, label: "Sponsor", active: false },
  { icon: Lightbulb, label: "Inspiration", active: false },
  { icon: Code2, label: "No-code", active: false },
  { icon: LayoutGrid, label: "Templates", active: false },
  { icon: Sparkles, label: "Ai", active: false },
  { icon: Type, label: "Typography", active: false },
  { icon: PenTool, label: "Design Tools", active: false },
];

interface MassSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function MassSidebar({ isOpen = true, onClose }: MassSidebarProps) {
  const [activeItem, setActiveItem] = useState("Home");

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
          <div className="w-12 h-12 relative">
            <svg viewBox="0 0 48 48" className="w-full h-full">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f0f0f0" />
                  <stop offset="50%" stopColor="#c0c0c0" />
                  <stop offset="100%" stopColor="#909090" />
                </linearGradient>
              </defs>
              <circle cx="24" cy="24" r="22" fill="url(#logoGradient)" />
              <text
                x="24"
                y="30"
                textAnchor="middle"
                fontSize="16"
                fontWeight="bold"
                fontFamily="serif"
                fontStyle="italic"
                fill="#0f0f0f"
              >
                Mass
              </text>
            </svg>
          </div>
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

      {/* Endorsed badge */}
      <div className="p-4 m-3 rounded-xl bg-[#1a1a1a]">
        <div className="text-[#666666] text-xs mb-2">Endorsed by</div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#4ade80] flex items-center justify-center">
            <span className="text-black text-xs font-bold">P</span>
          </div>
          <span className="text-white font-medium">Plaiter</span>
        </div>
      </div>
      </aside>
    </>
  );
}
