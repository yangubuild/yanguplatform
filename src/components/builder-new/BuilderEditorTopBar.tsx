import { ArrowLeft, Monitor, Smartphone, Sparkles, Settings, ShoppingBag, Globe, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Category } from "./types/builder.types";
import { CATEGORY_CONFIGS } from "./types/builder.types";

interface BuilderEditorTopBarProps {
  businessName: string;
  category: Category | null;
  onToggleAdaChat?: () => void;
  isAdaChatOpen?: boolean;
  viewportMode?: "desktop" | "mobile";
  onViewportChange?: (mode: "desktop" | "mobile") => void;
  onPublish?: () => void;
  onOpenSettings?: () => void;
}

export function BuilderEditorTopBar({
  businessName,
  category,
  onToggleAdaChat,
  isAdaChatOpen,
  viewportMode = "desktop",
  onViewportChange,
  onPublish,
  onOpenSettings,
}: BuilderEditorTopBarProps) {
  const navigate = useNavigate();
  const catLabel = category ? CATEGORY_CONFIGS[category]?.label : "Website";
  const catDomain = category ? CATEGORY_CONFIGS[category]?.domain : ".site";
  const showOrders = category === "emenu" || category === "eshop" || category === "estore";

  return (
    <div className="flex items-center justify-between px-2 sm:px-4 py-2 bg-foreground text-background shrink-0 gap-1">
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1 text-sm text-background/70 hover:text-background transition-colors shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        <span className="text-background/30 hidden sm:inline">|</span>
        <span className="text-xs sm:text-sm font-semibold text-background truncate max-w-[100px] sm:max-w-none">{businessName || "My Website"}</span>
        <span className="text-[11px] text-background/50 hidden lg:inline">{catLabel} ({catDomain})</span>
      </div>
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        {/* Desktop / Mobile toggles */}
        <TopBarButton
          icon={Monitor}
          label="Desktop"
          highlight={viewportMode === "desktop"}
          onClick={() => onViewportChange?.("desktop")}
          hideLabel
        />
        <TopBarButton
          icon={Smartphone}
          label="Mobile"
          highlight={viewportMode === "mobile"}
          onClick={() => onViewportChange?.("mobile")}
          hideLabel
        />
        <span className="w-px h-5 bg-background/20 mx-0.5 sm:mx-1" />

        {/* Ada AI / Editor Tools toggle */}
        {onToggleAdaChat && (
          <button
            onClick={onToggleAdaChat}
            title={isAdaChatOpen ? "Switch to Editor Tools" : "Open Ada AI Chat"}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isAdaChatOpen
                ? "bg-primary/20 text-primary hover:bg-primary/30"
                : "text-background/70 hover:text-background hover:bg-background/10"
            }`}
          >
            {isAdaChatOpen ? (
              <>
                <Wrench className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Editor Tools</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Ada AI</span>
              </>
            )}
          </button>
        )}

        <TopBarButton icon={Settings} label="Settings" onClick={onOpenSettings} hideLabel />
        {showOrders && <TopBarButton icon={ShoppingBag} label="Orders" hideLabel />}
        <button
          onClick={onPublish}
          className="ml-1 sm:ml-2 px-2.5 sm:px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1"
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Publish</span>
        </button>
      </div>
    </div>
  );
}

function TopBarButton({ icon: Icon, label, highlight, onClick, hideLabel }: { icon: any; label: string; highlight?: boolean; onClick?: () => void; hideLabel?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        highlight
          ? "bg-primary/20 text-primary hover:bg-primary/30"
          : "text-background/70 hover:text-background hover:bg-background/10"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {!hideLabel && <span className="hidden xl:inline">{label}</span>}
    </button>
  );
}
