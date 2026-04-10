import { useState } from "react";
import { X, Globe, FileText, Layers, File, MoreHorizontal, Mail, Phone, MessageSquare, MapPin, ArrowUpDown, Layout } from "lucide-react";
import type { LinkTargetType, LinkData } from "./EditorPopupTypes";

interface LinkPopupProps {
  onClose: () => void;
  onApply: (data: LinkData) => void;
  currentLink?: LinkData;
}

const MAIN_TABS: { key: LinkTargetType; icon: typeof Globe; label: string }[] = [
  { key: "page", icon: FileText, label: "Page" },
  { key: "section", icon: Layers, label: "Section" },
  { key: "web", icon: Globe, label: "Web" },
  { key: "document", icon: File, label: "Document" },
];

const MORE_OPTIONS: { key: LinkTargetType; icon: typeof Mail; label: string }[] = [
  { key: "email", icon: Mail, label: "Email" },
  { key: "phone", icon: Phone, label: "Phone number" },
  { key: "popup", icon: Layout, label: "Popup" },
  { key: "scroll", icon: ArrowUpDown, label: "Top/bottom of page" },
  { key: "whatsapp", icon: MessageSquare, label: "WhatsApp" },
  { key: "address", icon: MapPin, label: "Address" },
];

export function LinkPopup({ onClose, onApply, currentLink }: LinkPopupProps) {
  const [activeTab, setActiveTab] = useState<LinkTargetType>(currentLink?.type || "web");
  const [value, setValue] = useState(currentLink?.value || "");
  const [newTab, setNewTab] = useState(currentLink?.openInNewTab ?? true);
  const [showMore, setShowMore] = useState(false);

  const isMoreType = MORE_OPTIONS.some(o => o.key === activeTab);

  const getPlaceholder = () => {
    switch (activeTab) {
      case "web": return "e.g., www.example.com";
      case "email": return "e.g., hello@example.com";
      case "phone": return "e.g., +1 234 567 890";
      case "whatsapp": return "e.g., +1 234 567 890";
      case "address": return "e.g., 123 Main St, City";
      default: return "Enter value...";
    }
  };

  const getLabel = () => {
    switch (activeTab) {
      case "web": return "Web address";
      case "email": return "Email address";
      case "phone": return "Phone number";
      case "whatsapp": return "WhatsApp number";
      case "address": return "Address";
      case "page": return "Select page";
      case "section": return "Select section";
      case "document": return "Document";
      default: return "Value";
    }
  };

  return (
    <div className="w-[280px] bg-background rounded-xl shadow-2xl border border-border/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-sm font-semibold text-foreground">Link to</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-muted transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 pb-3">
        {MAIN_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setShowMore(false); }}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === tab.key && !isMoreType ? "bg-muted ring-1 ring-border" : "hover:bg-muted/50"
            }`}
            title={tab.label}
          >
            <tab.icon className="h-4 w-4 text-foreground" />
          </button>
        ))}
        <div className="relative">
          <button
            onClick={() => setShowMore(!showMore)}
            className={`p-2 rounded-lg transition-colors ${
              isMoreType || showMore ? "bg-muted ring-1 ring-border" : "hover:bg-muted/50"
            }`}
            title="More"
          >
            <MoreHorizontal className="h-4 w-4 text-foreground" />
          </button>
          {showMore && (
            <div className="absolute top-full right-0 mt-1 w-[200px] bg-background rounded-lg shadow-xl border border-border z-10">
              {MORE_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { setActiveTab(opt.key); setShowMore(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <opt.icon className="h-4 w-4 text-muted-foreground" />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3 space-y-3">
        <div>
          <p className="text-xs font-medium text-foreground mb-1.5">{getLabel()}</p>
          {activeTab === "document" ? (
            <button className="w-full py-2.5 rounded-lg border border-dashed border-primary/40 text-sm text-primary font-medium hover:bg-primary/5 transition-colors">
              Choose File
            </button>
          ) : (
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-colors"
            />
          )}
        </div>

        {/* Open in */}
        {(activeTab === "web" || activeTab === "page") && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Choose how it opens</p>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setNewTab(false)}
                className={`flex-1 py-1.5 text-xs font-medium transition-colors ${!newTab ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Current tab
              </button>
              <button
                onClick={() => setNewTab(true)}
                className={`flex-1 py-1.5 text-xs font-medium transition-colors ${newTab ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                New tab
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Remove Link</button>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onApply({ type: activeTab, value, openInNewTab: newTab })}
            disabled={!value.trim() && activeTab !== "document" && activeTab !== "popup" && activeTab !== "scroll"}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
