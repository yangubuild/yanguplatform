import {
  Home,
  PlusCircle,
  MessageSquare,
  Users,
  Radio,
  GraduationCap,
  UserCog,
} from "lucide-react";
import chatIcon9 from "@/assets/chat_icon_9.png";

export type SidebarItem =
  | "home"
  | "add-app"
  | "global-chat"
  | "friends"
  | "livestreaming"
  | "courses"
  | "team"
  | "chat";

const NAV_ITEMS: { id: SidebarItem; label: string; icon?: any; customIcon?: boolean }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "add-app", label: "Add App", icon: PlusCircle },
  { id: "global-chat", label: "Global Chat", icon: MessageSquare },
  { id: "friends", label: "Friends", icon: Users },
  { id: "livestreaming", label: "Livestreaming", icon: Radio },
  { id: "courses", label: "Courses", icon: GraduationCap },
  { id: "team", label: "Team", icon: UserCog },
  { id: "chat", label: "Chat", customIcon: true },
];

interface InnerPageSidebarProps {
  className?: string;
  activeItem: SidebarItem;
  onItemChange: (item: SidebarItem) => void;
}

export function InnerPageSidebar({ className = "", activeItem, onItemChange }: InnerPageSidebarProps) {
  return (
    <div
      className={`flex flex-col h-full ${className}`}
      style={{ background: "transparent" }}>
      {/* Main nav */}
      <nav className="px-2 mt-2 flex-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onItemChange(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 mb-0.5"
              style={{
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,0.6)" }}>
              {item.customIcon ? (
                <img
                  src={chatIcon9}
                  alt="Chat"
                  className="w-5 h-5 object-contain shrink-0"
                />
              ) : item.icon ? (
                <item.icon
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: isActive ? "#fff" : "rgba(255,255,255,0.45)" }}
                />
              ) : null}
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
