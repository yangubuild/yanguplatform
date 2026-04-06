import { ArrowLeft, Monitor, Smartphone, Sparkles, Settings, ShoppingBag, Globe, MessageSquare, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Category } from "./types/builder.types";
import { CATEGORY_CONFIGS } from "./types/builder.types";

interface BuilderEditorTopBarProps {
  businessName: string;
  category: Category | null;
  onToggleAdaChat?: () => void;
  isAdaChatOpen?: boolean;
}

export function BuilderEditorTopBar({ businessName, category, onToggleAdaChat, isAdaChatOpen }: BuilderEditorTopBarProps) {
  const navigate = useNavigate();
  const catLabel = category ? CATEGORY_CONFIGS[category]?.label : "Website";
  const catDomain = category ? CATEGORY_CONFIGS[category]?.domain : ".site";
  const showOrders = category === "emenu" || category === "eshop" || category === "estore";

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-foreground text-background shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-background/70 hover:text-background transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </button>
        <span className="text-background/30">|</span>
        <span className="text-sm font-semibold text-background">{businessName || "My Website"}</span>
        <span className="text-[11px] text-background/50">{catLabel} ({catDomain})</span>
      </div>
      <div className="flex items-center gap-1">
        <TopBarButton icon={Monitor} label="Desktop" />
        <TopBarButton icon={Smartphone} label="Mobile" />
        <span className="w-px h-5 bg-background/20 mx-1" />

        {/* Ada AI / Editor Tools toggle */}
        {onToggleAdaChat && (
          <button
            onClick={onToggleAdaChat}
            title={isAdaChatOpen ? "Switch to Editor Tools" : "Open Ada AI Chat"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isAdaChatOpen
                ? "bg-primary/20 text-primary hover:bg-primary/30"
                : "text-background/70 hover:text-background hover:bg-background/10"
            }`}
          >
            {isAdaChatOpen ? (
              <>
                <Wrench className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Editor Tools</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Ada AI</span>
              </>
            )}
          </button>
        )}

        <TopBarButton icon={Settings} label="Settings" />
        {showOrders && <TopBarButton icon={ShoppingBag} label="View Orders" />}
        <button className="ml-2 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          Publish
        </button>
      </div>
    </div>
  );
}

function TopBarButton({ icon: Icon, label, highlight }: { icon: any; label: string; highlight?: boolean }) {
  return (
    <button
      title={label}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        highlight
          ? "bg-primary/20 text-primary hover:bg-primary/30"
          : "text-background/70 hover:text-background hover:bg-background/10"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
