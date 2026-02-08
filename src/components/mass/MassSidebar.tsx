import { useState } from "react";
import {
  Home,
  Info,
  Heart,
  Lightbulb,
  Code,
  Layout,
  Sparkles,
  Type,
  Palette,
  X,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", id: "home", isActive: true },
  { icon: Info, label: "About Us", id: "about" },
  { icon: Heart, label: "Sponsor", id: "sponsor" },
  { divider: true },
  { icon: Lightbulb, label: "Inspiration", id: "inspiration" },
  { icon: Code, label: "No-code", id: "nocode" },
  { icon: Layout, label: "Templates", id: "templates" },
  { icon: Sparkles, label: "Ai", id: "ai" },
  { icon: Type, label: "Typography", id: "typography" },
  { icon: Palette, label: "Design Tools", id: "design-tools" },
];

interface MassSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function MassSidebar({ isOpen = true, onClose }: MassSidebarProps) {
  const [activeItem, setActiveItem] = useState("home");

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
        className={`fixed left-0 top-0 h-screen w-[220px] bg-[#0f0f0f] flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
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
        <div className="p-6 pb-4">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm italic">Mass</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {navItems.map((item, index) => {
            if (item.divider) {
              return <div key={`divider-${index}`} className="h-4" />;
            }
            
            const Icon = item.icon!;
            const isActive = activeItem === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveItem(item.id!)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all mb-0.5 ${
                  isActive
                    ? "bg-[#1a1a1a] text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
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
          <div className="text-white/40 text-xs mb-2">Endorsed by</div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#F16612] flex items-center justify-center">
              <span className="text-black text-xs font-bold">P</span>
            </div>
            <span className="text-white font-medium">Plaiter</span>
          </div>
        </div>
      </aside>
    </>
  );
}
