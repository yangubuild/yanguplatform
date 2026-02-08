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
        className={`fixed left-0 top-0 h-screen w-[240px] flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: '#0D1F17',
        }}
      >
        {/* Right edge separator */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-[1px] pointer-events-none"
          style={{
            background: 'rgba(255,255,255,0.06)',
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
                  background: '#1B4D3E',
                } : isHovered ? {
                  background: 'rgba(27,77,62,0.4)',
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

        {/* Start Selling CTA */}
        <div 
          className="p-4 mx-3 mb-4 rounded-xl"
          style={{
            background: '#152A20',
          }}
        >
          <div className="text-white font-medium text-sm mb-1">Start Selling</div>
          <div className="text-white/40 text-xs mb-3">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</div>
          <button 
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white"
            style={{
              background: '#F46D2A',
            }}
          >
            Start Building
          </button>
        </div>
      </aside>
    </>
  );
}
