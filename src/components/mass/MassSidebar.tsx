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
  ChevronRight,
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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
        className={`fixed left-0 top-0 h-screen w-[240px] bg-[#141414] flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Right edge gradient fade for depth separation */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-[1px] pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
          }}
        />
        
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="p-5 pb-6">
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm italic">Mass</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto">
          {navItems.map((item, index) => {
            if (item.divider) {
              return <div key={`divider-${index}`} className="h-6" />;
            }
            
            const Icon = item.icon!;
            const isActive = activeItem === item.id;
            const isHovered = hoveredItem === item.id;
            const showArrow = isHovered && !isActive;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveItem(item.id!)}
                onMouseEnter={() => setHoveredItem(item.id!)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`relative w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm transition-all mb-1 ${
                  isActive
                    ? "text-white"
                    : "text-white/50 hover:text-white/70"
                }`}
                style={isActive ? {
                  background: 'linear-gradient(135deg, rgba(60,60,60,0.5) 0%, rgba(40,40,40,0.4) 50%, rgba(30,30,30,0.3) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.2)',
                } : isHovered ? {
                  background: 'linear-gradient(135deg, rgba(50,50,50,0.3) 0%, rgba(35,35,35,0.2) 100%)',
                } : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  <span className="font-normal">{item.label}</span>
                </div>
                {showArrow && (
                  <ChevronRight className="w-4 h-4 text-white/30" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Endorsed badge */}
        <div className="p-4 mx-3 mb-4 rounded-xl bg-[#1c1c1c]">
          <div className="text-white/40 text-xs mb-2">Endorsed by</div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#F16612] flex items-center justify-center">
              <span className="text-black text-xs font-bold">P</span>
            </div>
            <span className="text-white font-medium text-sm">Plaiter</span>
          </div>
        </div>
      </aside>
    </>
  );
}
